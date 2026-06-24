const asambleistaModel = require('../models/AsambleistaModel');
const pool = require('../config/db'); // Para nombramientos


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

async function consultarCertificacion(req, res) {
    const { idAsambleista, fechaDesde, fechaHasta } = req.body;
    try {
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

// COLABORACIÓN – APOYO PARA COMPLETAR REQUISITOS

// CRUD de asambleístas
async function listarAsambleistas(req, res) {
    try {
        const asambleistas = await asambleistaModel.listarTodos();
        res.json(asambleistas);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar asambleístas' });
    }
}

async function crearAsambleista(req, res) {
    const { cedula, nombre, correo } = req.body;
    if (!cedula || !nombre || !correo) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (cédula, nombre, correo)' });
    }
    try {
        const nuevo = await asambleistaModel.crearAsambleista(cedula, nombre, correo);
        res.status(201).json(nuevo);
    } catch (error) {
        if (error.constraint === 'asambleista_cedula_key') {
            return res.status(409).json({ error: 'La cédula ya está registrada' });
        }
        res.status(500).json({ error: 'Error al crear asambleísta' });
    }
}

async function actualizarAsambleista(req, res) {
    const id = parseInt(req.params.id);
    const { cedula, nombre, correo } = req.body;
    try {
        const actualizado = await asambleistaModel.actualizarAsambleista(id, cedula, nombre, correo);
        if (!actualizado) return res.status(404).json({ error: 'Asambleísta no encontrado' });
        res.json(actualizado);
    } catch (error) {
        if (error.constraint === 'asambleista_cedula_key') {
            return res.status(409).json({ error: 'La cédula ya está registrada' });
        }
        res.status(500).json({ error: 'Error al actualizar' });
    }
}

async function eliminarAsambleista(req, res) {
    const id = parseInt(req.params.id);
    try {
        const eliminado = await asambleistaModel.eliminarAsambleista(id);
        if (!eliminado) return res.status(404).json({ error: 'No encontrado o tiene nombramientos' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//  Gestión de nombramientos (maestro-detalle)
async function listarNombramientos(req, res) {
    const asambleistaId = parseInt(req.params.id);
    try {
        const query = `
            SELECT n.*, cs.nombre as sector, cp.nombre_puesto as puesto, r.numero_resolucion
            FROM nombramiento n
            LEFT JOIN catalogo_sector cs ON n.sector_id = cs.id_sector
            LEFT JOIN catalogo_puestos cp ON n.id_puesto = cp.id_puesto
            LEFT JOIN resolucion r ON n.resolucion_id = r.resolucion_id
            WHERE n.asambleista_id = $1
            ORDER BY n.fecha_inicio DESC
        `;
        const { rows } = await pool.query(query, [asambleistaId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar nombramientos' });
    }
}

async function crearNombramiento(req, res) {
    const asambleistaId = parseInt(req.params.id);
    const { sector_id, id_puesto, resolucion_id, fecha_inicio, fecha_fin, estado } = req.body;
    if (!sector_id || !id_puesto || !resolucion_id || !fecha_inicio || !estado) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para el nombramiento' });
    }
    try {
        const query = `
            INSERT INTO nombramiento (asambleista_id, sector_id, id_puesto, resolucion_id, fecha_inicio, fecha_fin, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [asambleistaId, sector_id, id_puesto, resolucion_id, fecha_inicio, fecha_fin || null, estado]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}

async function obtenerNombramientoPorId(req, res) {
    const id = parseInt(req.params.id);
    try {
        const query = `
            SELECT *
            FROM nombramiento
            WHERE nombramiento_id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Nombramiento no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener nombramiento' });
    }
}

async function actualizarNombramiento(req, res) {
    const id = parseInt(req.params.id);
    const { sector_id, id_puesto, resolucion_id, fecha_inicio, fecha_fin, estado } = req.body;
    try {
        const query = `
            UPDATE nombramiento
            SET sector_id=$1, id_puesto=$2, resolucion_id=$3, fecha_inicio=$4, fecha_fin=$5, estado=$6
            WHERE nombramiento_id=$7
            RETURNING *
        `;
        const { rows } = await pool.query(query, [sector_id, id_puesto, resolucion_id, fecha_inicio, fecha_fin || null, estado, id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Nombramiento no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}

async function eliminarNombramiento(req, res) {
    const id = parseInt(req.params.id);
    try {
        const query = `DELETE FROM nombramiento WHERE nombramiento_id = $1 RETURNING nombramiento_id`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Nombramiento no encontrado' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar nombramiento' });
    }
}

module.exports = {
    // Issue #3 (original)
    buscarAsambleistas,
    obtenerAsambleistaPorId,
    consultarCertificacion,
    // Colaboración (Asambleístas)
    listarAsambleistas,
    crearAsambleista,
    actualizarAsambleista,
    eliminarAsambleista,
    // Colaboración (Nombramientos)
    listarNombramientos,
    crearNombramiento,
    obtenerNombramientoPorId,
    actualizarNombramiento,
    eliminarNombramiento
};
