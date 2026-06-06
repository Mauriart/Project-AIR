const express = require('express');
const router = express.Router();

const ReporteModel = require('../models/ReporteModel');
const { verificarAutenticacion, requiereRol } = require('./AuthController');

const ROLES_REPORTES = ['Administrador', 'Secretaría', 'SecretarÃ­a'];

// Escapa valores para generar CSV sin depender de paquetes externos.
function escaparCsv(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

// Convierte las filas de aportes a un documento CSV descargable.
function generarCsvAportes(filas) {
  const encabezados = ['folio', 'fecha', 'asambleista', 'propuestas', 'porcentaje_asistencia'];
  const lineas = filas.map(fila => encabezados.map(campo => escaparCsv(fila[campo])).join(','));
  return [encabezados.join(','), ...lineas].join('\r\n');
}

// GET /reportes/certificaciones
router.get('/certificaciones', verificarAutenticacion, requiereRol(...ROLES_REPORTES), async (req, res) => {
  try {
    const metricas = await ReporteModel.obtenerMetricasCertificaciones();
    return res.status(200).json({ ok: true, data: metricas });
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo reportes' });
  }
});

// GET /reportes/exportar/:id_asambleista
router.get('/exportar/:id_asambleista', verificarAutenticacion, requiereRol(...ROLES_REPORTES), async (req, res) => {
  try {
    const filas = await ReporteModel.obtenerAportesAsambleista(req.params.id_asambleista);
    const csv = generarCsvAportes(filas);
    const nombreArchivo = `aportes-asambleista-${req.params.id_asambleista}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    console.error('Error exportando aportes:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error exportando aportes' });
  }
});

module.exports = router;
