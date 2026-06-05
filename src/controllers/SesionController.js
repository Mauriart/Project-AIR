const express = require('express');
const router  = express.Router();

const SesionModel = require('../models/SesionModel');
const { verificarAutenticacion, requiereRol } = require('./AuthController');

const ROLES_GESTION_SESIONES = ['Administrador', 'Secretaría'];

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

// GET /sesiones/catalogos
// Devuelve catálogos necesarios para crear sesiones
router.get('/catalogos', verificarAutenticacion, async (req, res) => {
  try {
    const catalogos = await SesionModel.obtenerCatalogosSesion();
    return res.status(200).json({ ok: true, data: catalogos });
  } catch (error) {
    console.error('Error obteniendo catálogos de sesión:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /sesiones/propuestas-disponibles
// Propuestas que todavía pueden agregarse a una agenda
router.get('/propuestas-disponibles', verificarAutenticacion, async (req, res) => {
  try {
    const propuestas = await SesionModel.obtenerPropuestasElegiblesAgenda();
    return res.status(200).json({ ok: true, data: propuestas });
  } catch (error) {
    console.error('Error obteniendo propuestas disponibles:', error);
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
router.post('/', verificarAutenticacion, requiereRol(...ROLES_GESTION_SESIONES),
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

// GET /sesiones/:id/agenda
// Lista el orden del día de una sesión
router.get('/:id/agenda', verificarAutenticacion, async (req, res) => {
  try {
    const agenda = await SesionModel.obtenerAgendaSesion(req.params.id);
    return res.status(200).json({ ok: true, data: agenda });
  } catch (error) {
    console.error('Error obteniendo agenda:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /sesiones/:id/agenda
// Agrega una propuesta al orden del día
router.post('/:id/agenda', verificarAutenticacion, requiereRol(...ROLES_GESTION_SESIONES),
async (req, res) => {
  const { id_propuesta, orden } = req.body;

  if (!id_propuesta || !orden) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Faltan campos obligatorios: id_propuesta, orden'
    });
  }

  if (Number(orden) <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El orden debe ser mayor a 0'
    });
  }

  try {
    const punto = await SesionModel.agregarPuntoAgenda(req.params.id, req.body);
    return res.status(201).json({ ok: true, data: punto });
  } catch (error) {
    console.error('Error agregando punto de agenda:', error);
    return res.status(400).json({ ok: false, mensaje: error.message || 'Error interno' });
  }
});

// POST /sesiones/:id/agenda/:punto/resolucion
// Registra la resolución oficial de un punto de agenda
router.post('/:id/agenda/:punto/resolucion', verificarAutenticacion,
requiereRol(...ROLES_GESTION_SESIONES), async (req, res) => {
  const { numero_resolucion, fecha_emision, aprobada } = req.body;

  if (!numero_resolucion || !fecha_emision || aprobada === undefined) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Faltan campos obligatorios: numero_resolucion, fecha_emision, aprobada'
    });
  }

  try {
    const resolucion = await SesionModel.registrarResolucionAgenda(
      req.params.id,
      req.params.punto,
      req.body
    );
    return res.status(201).json({
      ok: true,
      data: resolucion,
      mensaje: aprobada ? 'Resolución registrada y propuesta aprobada' : 'Resolución registrada'
    });
  } catch (error) {
    console.error('Error registrando resolución:', error);
    return res.status(400).json({ ok: false, mensaje: error.message || 'Error interno' });
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

// GET /sesiones/:id/asistencia
// Obtiene la asistencia registrada de una sesión
router.get('/:id/asistencia', verificarAutenticacion, async (req, res) => {
  try {
    const asistencia = await SesionModel.obtenerAsistenciaSesion(req.params.id);
    return res.status(200).json({ ok: true, data: asistencia });
  } catch (error) {
    console.error('Error obteniendo asistencia:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /sesiones/:id/asistencia
// Registra el pase de lista de una sesión
router.post('/:id/asistencia', verificarAutenticacion,
requiereRol(...ROLES_GESTION_SESIONES), async (req, res) => {
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
