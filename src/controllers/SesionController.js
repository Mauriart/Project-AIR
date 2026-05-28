const express = require('express');
const router  = express.Router();

const SesionModel = require('../models/SesionModel');
const { verificarAutenticacion, requiereRol } = require('./AuthController');

// GET /sesiones
// Lista todas las sesiones
router.get('/', verificarAutenticacion, async (req, res) => {
  try {
    const sesiones = await SesionModel.obtenerSesiones();
    return res.status(200).json({ ok: true, data: sesiones });
  } catch (error) {
    console.error('Error obteniendo sesiones:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /sesiones/:id
// Obtiene una sesión por ID
router.get('/:id', verificarAutenticacion, async (req, res) => {
  try {
    const sesion = await SesionModel.obtenerSesionPorId(req.params.id);
    if (!sesion) {
      return res.status(404).json({ ok: false, mensaje: 'Sesión no encontrada' });
    }
    return res.status(200).json({ ok: true, data: sesion });
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /sesiones
// Crea una nueva sesión
router.post('/', verificarAutenticacion, requiereRol('Administrador', 'Secretaría'),
async (req, res) => {
  const { id_tipo_modalidad, id_tipo_sesion, numero_sesion, fecha, quorum } = req.body;

  if (!id_tipo_modalidad || !id_tipo_sesion || !numero_sesion || !fecha || !quorum) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Faltan campos obligatorios: tipo_modalidad, tipo_sesion, numero_sesion, fecha, quorum'
    });
  }

  if (quorum <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El quórum debe ser mayor a 0'
    });
  }

  try {
    const sesion = await SesionModel.crearSesion(req.body);
    return res.status(201).json({ ok: true, data: sesion });
  } catch (error) {
    console.error('Error creando sesión:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /sesiones/:id/padron
// Obtiene el padrón de asambleístas activos para el pase de lista
router.get('/:id/padron', verificarAutenticacion, async (req, res) => {
  try {
    const padron = await SesionModel.obtenerAsambleistasPadron();
    return res.status(200).json({ ok: true, data: padron });
  } catch (error) {
    console.error('Error obteniendo padrón:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /sesiones/:id/asistencia
// Registra el pase de lista de una sesión
router.post('/:id/asistencia', verificarAutenticacion,
requiereRol('Administrador', 'Secretaría'), async (req, res) => {
  const { asistencias } = req.body;
  const id_sesion = req.params.id;

  if (!asistencias || !Array.isArray(asistencias) || asistencias.length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Debe enviar la lista de asistencias'
    });
  }

  try {
    await SesionModel.registrarAsistencia(id_sesion, asistencias);
    const resumen = await SesionModel.obtenerResumenAsistencia(id_sesion);
    return res.status(200).json({
      ok: true,
      mensaje: 'Asistencia registrada correctamente',
      data: resumen
    });
  } catch (error) {
    console.error('Error registrando asistencia:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /sesiones/:id/quorum
// Verifica si una sesión tiene quórum legal
router.get('/:id/quorum', verificarAutenticacion, async (req, res) => {
  try {
    const resumen = await SesionModel.obtenerResumenAsistencia(req.params.id);
    if (!resumen) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Sesión no encontrada o sin asistencia registrada'
      });
    }
    return res.status(200).json({ ok: true, data: resumen });
  } catch (error) {
    console.error('Error verificando quórum:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;