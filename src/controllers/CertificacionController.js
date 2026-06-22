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
    const certs = await CertificacionModel.obtenerCertificaciones(req.query);
    return res.status(200).json({ ok: true, data: certs });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

router.get('/verificar/:folio', async (req, res) => {
  try {
    const cert = await CertificacionModel.obtenerPorFolio(req.params.folio);
    if (!cert) return res.status(404).json({ ok: false, valida: false, mensaje: 'Folio no encontrado' });
    if (cert.anulada) return res.status(200).json({ ok: true, valida: false, mensaje: 'Certificación anulada', motivo: cert.motivo_anulacion });
    return res.status(200).json({ ok: true, valida: true, mensaje: 'Certificación válida', data: { folio: cert.folio_unico, asambleista: cert.asambleista, cedula: cert.cedula, fecha: cert.fecha_emision } });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
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


// Endpoint para generar y descargar el certificado en PDF
router.post('/generar-pdf', async (req, res) => {
    const { idAsambleista } = req.body;

    if (!idAsambleista) {
        return res.status(400).json({ ok: false, mensaje: 'Se requiere id_asambleista' });
    }

    try {
        // 1. Obtener datos del asambleísta (con rango de fechas opcional)
        const datos = await CertificacionModel.obtenerDatosCertificacion(idAsambleista);
        if (!datos || datos.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'No se encontraron datos para el asambleísta' });
        }

        // 2. Generar HTML temporal para calcular hash (sin folio aún)
        let htmlTemp = TemplateService.renderizarCertificado(datos, '{{FOLIO}}', '{{HASH}}');
        const hash = CryptoService.generarHash(htmlTemp);

        // 3. Emitir certificación (guarda en BD y genera folio)
        const certificado = await CertificacionModel.emitirCertificacion(idAsambleista, req.usuario?.username || 'sistema', hash);
        const folio = certificado.folio_unico;

        // 4. Generar HTML final con folio y hash reales
        const htmlFinal = TemplateService.renderizarCertificado(datos, folio, hash);

        // 5. Generar PDF
        const pdfBuffer = await PDFService.generarPDF(htmlFinal);

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
