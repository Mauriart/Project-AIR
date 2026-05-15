// Issue #3: Controlador de buscador

const asambleistaModel = require('../models/AsambleistaModel');

// Endpoint: búsqueda de asambleístas (por nombre o cédula)
async function buscarAsambleistas(req, res) {
    const termino = req.query.termino || '';
    if (termino.length < 2) {
        return res.json([]);
    }
    try {
        const resultados = await asambleistaModel.buscarPorTermino(termino);
        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al buscar asambleístas' });
    }
}

// Endpoint: obtener detalle de un asambleísta por ID
async function obtenerAsambleistaPorId(req, res) {
    const id = parseInt(req.params.id);
    try {
        const asambleista = await asambleistaModel.obtenerPorId(id);
        if (!asambleista) {
            return res.status(404).json({ error: 'Asambleísta no encontrado' });
        }
        res.json(asambleista);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener asambleísta' });
    }
}

// Endpoint: consulta de certificación (preparado para futuro)
async function consultarCertificacion(req, res) {
    const { idAsambleista, fechaDesde, fechaHasta } = req.body;
    try {
        // Aquí después llamarás a un servicio real
        res.json({
            mensaje: `Consulta para ID ${idAsambleista} (pendiente de implementar)`,
            periodo: fechaDesde ? `${fechaDesde} al ${fechaHasta}` : 'Todo el historial',
            participaciones: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar certificación' });
    }
    
}

module.exports = {
    buscarAsambleistas,
    obtenerAsambleistaPorId,
    consultarCertificacion
};
