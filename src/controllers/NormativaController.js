const express = require('express');
const router  = express.Router();

const NormativaModel = require('../models/NormativaModel');
const { verificarAutenticacion, requierePermiso } = require('./AuthController');

// GET /normativa/reglamentos
// Devuelve la lista de todos los reglamentos
router.get('/reglamentos', verificarAutenticacion, async (req, res) => {
  try {
    const reglamentos = await NormativaModel.obtenerReglamentos();
    return res.status(200).json({ ok: true, data: reglamentos });
  } catch (error) {
    console.error('Error obteniendo reglamentos:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /normativa/arbol/:id_reglamento
// Devuelve el árbol completo de un reglamento (solo elementos vigentes)
router.get('/arbol/:id_reglamento', verificarAutenticacion, async (req, res) => {
  try {
    const { id_reglamento } = req.params;
    const arbol = await NormativaModel.obtenerArbolReglamento(id_reglamento);
    return res.status(200).json({ ok: true, data: arbol });
  } catch (error) {
    console.error('Error obteniendo árbol:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /normativa/propuestas
// Devuelve todas las propuestas
router.get('/propuestas', verificarAutenticacion, async (req, res) => {
  try {
    const propuestas = await NormativaModel.obtenerPropuestas();
    return res.status(200).json({ ok: true, data: propuestas });
  } catch (error) {
    console.error('Error obteniendo propuestas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /normativa/propuestas
// Crea una nueva propuesta
router.post('/propuestas', verificarAutenticacion, requierePermiso('GESTIONAR_PROPUESTAS'), async (req, res) => {
  const {
    id_reglamento_base, id_etapa_propuesta,
    id_estado_propuesta, id_propuesta_padre,
    titulo, texto_sustitutivo, codigo_air,
    id_tipo_mayoria_requerida
  } = req.body;

  // Validación de campos obligatorios
  if (!titulo || !id_etapa_propuesta || !id_estado_propuesta || !id_tipo_mayoria_requerida) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Faltan campos obligatorios: titulo, etapa, estado y tipo de mayoría'
    });
  }

  try {
    const propuesta = await NormativaModel.crearPropuesta(req.body);
    return res.status(201).json({ ok: true, data: propuesta });
  } catch (error) {
    console.error('Error creando propuesta:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /normativa/sesiones
// Devuelve todas las sesiones disponibles (para el selector en UI)
router.get('/sesiones', verificarAutenticacion, async (req, res) => {
  try {
    const sesiones = await NormativaModel.obtenerSesiones();
    return res.status(200).json({ ok: true, data: sesiones });
  } catch (error) {
    console.error('Error obteniendo sesiones:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
