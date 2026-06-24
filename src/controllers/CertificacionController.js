const express = require('express');
const router = express.Router();


const CertificacionModel = require('../models/CertificacionModel');
const TemplateService = require('../services/TemplateService');
const PDFService = require('../services/PDFService');
const CryptoService = require('../services/CryptoService');

const { generarHash } = require('../services/CryptoService');

const pool = require('../config/db');
const { verificarAutenticacion, requierePermiso, requiereRol } = require('./AuthController');

const { renderizarCertificado } = require('../services/TemplateService');
const { generarPDF } = require('../services/PDFService');

router.get('/preview-folio', verificarAutenticacion, requierePermiso('EMITIR_CERTIFICACION'), async (req, res) => {

    try {

        const query = `
            SELECT fn_preview_siguiente_folio() AS folio;
        `;

        const result = await pool.query(query);

        res.json({
            ok: true,
            folio: result.rows[0].folio
        });

    } catch (error) {

        console.error(error.message);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo folio'
        });
    }
});

router.get('/siguiente-folio', verificarAutenticacion, async (req, res) => {
  try {
    const folio = await CertificacionModel.obtenerSiguienteFolio();
    return res.status(200).json({ ok: true, folio });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo folio' });
  }
});

router.get('/', verificarAutenticacion, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id_certificacion,
                c.folio_unico,
                c.fecha_emision,
                c.usuario_secretaria,
                a.nombre AS asambleista_nombre,
                a.cedula,
                an.id_anulacion IS NOT NULL AS anulada,
                an.motivo AS motivo_anulacion
            FROM certificacion_emitida c
            LEFT JOIN asambleista a ON c.id_asambleista = a.asambleista_id
            LEFT JOIN anulacion_certificacion an ON c.id_certificacion = an.id_certificacion
            ORDER BY c.fecha_emision DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);  // ← Devuelve el array directamente
    } catch (error) {
        console.error('Error en GET /certificaciones:', error);
        res.status(500).json([]);
    }
});

router.get('/verificar/:folio', async (req, res) => {
    try {
        const folio = req.params.folio;
        // Consulta principal con JOIN a asambleista y LEFT JOIN a anulacion
        const query = `
            SELECT 
                c.folio_unico,
                c.fecha_emision,
                c.usuario_secretaria,
                a.nombre AS asambleista_nombre,
                a.cedula AS asambleista_cedula,
                an.id_anulacion IS NOT NULL AS anulada,
                an.motivo AS motivo_anulacion
            FROM certificacion_emitida c
            LEFT JOIN asambleista a ON c.id_asambleista = a.asambleista_id
            LEFT JOIN anulacion_certificacion an ON c.id_certificacion = an.id_certificacion
            WHERE c.folio_unico = $1
        `;
        const result = await pool.query(query, [folio]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                ok: false, 
                valida: false, 
                mensaje: 'Folio no encontrado' 
            });
        }
        
        const cert = result.rows[0];
        
        // Si está anulada (existe registro en anulacion_certificacion)
        if (cert.anulada) {
            return res.status(200).json({
                ok: true,
                valida: false,
                anulada: true,
                mensaje: 'Certificación anulada',
                motivo: cert.motivo_anulacion || 'No especificado',
                folio: cert.folio_unico
            });
        }
        
        // Certificación válida
        return res.status(200).json({
            ok: true,
            valida: true,
            mensaje: 'Certificación válida',
            folio: cert.folio_unico,
            asambleistaNombre: cert.asambleista_nombre || 'No disponible',
            asambleistaCedula: cert.asambleista_cedula || 'No disponible',
            fechaEmision: cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString() : 'No disponible',
            emitidaPor: cert.usuario_secretaria || 'No disponible'
        });
    } catch (error) {
        console.error('Error en verificar:', error);
        return res.status(500).json({ 
            ok: false, 
            mensaje: 'Error interno al verificar folio' 
        });
    }
});

router.post('/', verificarAutenticacion, requiereRol('Administrador', 'Secretaría'), async (req, res) => {
  const { id_asambleista, contenido } = req.body;
  if (!id_asambleista || !contenido) return res.status(400).json({ ok: false, mensaje: 'Se requiere id_asambleista y contenido' });
  try {
    const hash = generarHash(contenido);
    const cert = await CertificacionModel.emitirCertificacion(id_asambleista, req.usuario.username, hash);
    return res.status(201).json({ ok: true, data: cert, mensaje: `Certificación emitida. Folio: ${cert.folio_unico}` });
  } catch (error) {
    console.error('Error completo:', error);
    return res.status(500).json({ ok: false, mensaje: error.message || 'Error interno' });
  }
});

router.post('/:id/anular', verificarAutenticacion, requierePermiso('EMITIR_CERTIFICACION'), async (req, res) => {
  const { motivo } = req.body;
  if (!motivo) return res.status(400).json({ ok: false, mensaje: 'El motivo es obligatorio' });
  try {
    const anulacion = await CertificacionModel.anularCertificacion(req.params.id, motivo, req.usuario.username);
    return res.status(200).json({ ok: true, data: anulacion, mensaje: 'Certificación anulada' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message || 'Error interno' });
  }
});

// ========== PREVISUALIZACIÓN DEL CERTIFICADO ==========
router.post('/previsualizar', async (req, res) => {
    const { idAsambleista, fechaDesde, fechaHasta } = req.body;
    if (!idAsambleista) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere id_asambleista' });
    }
    try {
        // Obtener datos del asambleísta 
        const datos = await CertificacionModel.obtenerDatosCertificacion(idAsambleista, fechaDesde, fechaHasta);
        if (!datos || datos.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'No se encontraron datos para el asambleísta' });
        }

        // Generar HTML sin guardar (folio y hash ficticios para previsualización)
        const html = TemplateService.renderizarCertificado(datos, 'PREVIEW', 'hash_preview');

        // Enviar HTML directamente (para mostrarlo en el modal)
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('Error en /previsualizar:', error);
        res.status(500).json({ ok: false, mensaje: error.message || 'Error al generar previsualización' });
    }
});

// Endpoint para generar y descargar el certificado en PDF
router.post('/generar-pdf', async (req, res) => {
    const { idAsambleista, fechaDesde, fechaHasta } = req.body;
    if (!idAsambleista) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere id_asambleista' });
    }
    try {
        // 1. Obtener datos del asambleísta
        const datos = await CertificacionModel.obtenerDatosCertificacion(idAsambleista, fechaDesde, fechaHasta);
        if (!datos || datos.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'No se encontraron datos para el asambleísta' });
        }

        // 2. Estructurar datos para PDFKit
        const asambleista = datos[0];
        // Agrupar propuestas (evitar duplicados)
        const propuestasMap = {};
        datos.forEach(row => {
            if (row.id_propuesta && !propuestasMap[row.id_propuesta]) {
                propuestasMap[row.id_propuesta] = {
                    titulo: row.titulo,
                    codigo_air: row.codigo_air,
                    sesion_fecha: row.sesion_fecha,
                    nota_legal: row.nota_legal
                };
            }
        });
        const propuestas = Object.values(propuestasMap);

        const contenido = {
            asambleista: {
                nombre: asambleista.nombre,
                cedula: asambleista.cedula,
                sector_nombre: asambleista.sector_nombre,
                nombramiento_inicio: asambleista.nombramiento_inicio,
                nombramiento_fin: asambleista.nombramiento_fin,
                total_asistencias_plenarias: asambleista.total_asistencias_plenarias || 0,
                hash: null // se llenará después
            },
            propuestas: propuestas
        };

        // 3. Generar hash del contenido
        const hash = CryptoService.generarHash(JSON.stringify(contenido));
        contenido.asambleista.hash = hash;

        // 4. Emitir certificación (guardar en BD y generar folio)
        const certificado = await CertificacionModel.emitirCertificacion(idAsambleista, req.usuario?.username || 'sistema', hash);
        const folio = certificado.folio_unico;

        // 5. Generar PDF con pdfkit
        const pdfBuffer = await PDFService.generarPDF(contenido, folio);

        // 6. Enviar respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificado_${folio}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error en /generar-pdf:', error);
        res.status(500).json({ ok: false, mensaje: error.message || 'Error interno al generar el certificado' });
    }
});


module.exports = router;
