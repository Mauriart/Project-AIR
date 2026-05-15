// src/controllers/BuscadorRoutes.js
const express = require('express');
const router = express.Router();
const buscadorController = require('./buscadorController');

// Rutas del buscador (Issue #3)
router.get('/buscar', buscadorController.buscarAsambleistas);
router.get('/:id', buscadorController.obtenerAsambleistaPorId);
router.post('/consultar', buscadorController.consultarCertificacion);

module.exports = router;