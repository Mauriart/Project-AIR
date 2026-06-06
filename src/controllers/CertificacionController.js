const express = require('express');
const router = express.Router();


const CertificacionModel = require('../models/CertificacionModel');
const { generarHash } = require('../services/CryptoService');

const pool = require('../config/db');
const { verificarAutenticacion, requierePermiso, requiereRol } = require('./AuthController');

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

module.exports = router;
