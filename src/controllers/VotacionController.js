const express = require('express');
const router  = express.Router();

const VotacionModel = require('../models/VotacionModel');
const SesionModel   = require('../models/SesionModel');
const { verificarAutenticacion, requiereRol } = require('./AuthController');

// GET /votaciones/sesion/:id_sesion
// Propuestas agendadas en la sesión disponibles para votar
router.get('/sesion/:id_sesion', verificarAutenticacion, async (req, res) => {
  try {
    const propuestas = await VotacionModel.obtenerPropuestasParaVotar(req.params.id_sesion);
    return res.status(200).json({ ok: true, data: propuestas });
  } catch (error) {
    console.error('Error obteniendo propuestas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /votaciones
// Registra una votación y calcula el resultado automáticamente
router.post('/', verificarAutenticacion,
requiereRol('Administrador', 'Secretaría'), async (req, res) => {
  const { id_sesion, id_propuesta, votos_favor, votos_contra, abstenciones } = req.body;

  // Validar campos obligatorios
  if (!id_sesion || !id_propuesta ||
      votos_favor === undefined || votos_contra === undefined || abstenciones === undefined) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Faltan campos: id_sesion, id_propuesta, votos_favor, votos_contra, abstenciones'
    });
  }

  // Validar que los votos sean números positivos
  if (votos_favor < 0 || votos_contra < 0 || abstenciones < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Los votos no pueden ser negativos'
    });
  }

  // Verificar quórum antes de registrar la votación
  const tieneQuorum = await SesionModel.validarQuorumLegal(id_sesion);
  if (!tieneQuorum) {
    return res.status(400).json({
      ok: false,
      mensaje: 'No hay quórum legal en esta sesión. No se puede registrar la votación.'
    });
  }

  try {
    const votacion = await VotacionModel.registrarVotacion(req.body);
    return res.status(201).json({
      ok: true,
      data: votacion,
      mensaje: `Votación registrada. Resultado: ${votacion.resultado}`
    });
  } catch (error) {
    console.error('Error registrando votación:', error);
    return res.status(500).json({ ok: false, mensaje: error.message || 'Error interno' });
  }
});

// PUT /votaciones/:id/firmar
// Firma una votación — después no se puede modificar
router.put('/:id/firmar', verificarAutenticacion,
requiereRol('Administrador', 'Secretaría'), async (req, res) => {
  try {
    const votacion = await VotacionModel.firmarVotacion(req.params.id);
    return res.status(200).json({
      ok: true,
      data: votacion,
      mensaje: 'Votación firmada. Ya no puede modificarse.'
    });
  } catch (error) {
    console.error('Error firmando votación:', error);
    return res.status(500).json({ ok: false, mensaje: error.message || 'Error interno' });
  }
});

// GET /votaciones/sesion/:id_sesion/historial
// Historial de votaciones de una sesión
router.get('/sesion/:id_sesion/historial', verificarAutenticacion, async (req, res) => {
  try {
    const votaciones = await VotacionModel.obtenerVotacionesSesion(req.params.id_sesion);
    return res.status(200).json({ ok: true, data: votaciones });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;