const pool = require('../config/db');

async function buscarPorTermino(termino) {
    try {
        const query = `
            SELECT 
                asambleista_id AS id,
                cedula,
                nombre,
                correo_institucional AS correo
            FROM asambleista
            WHERE nombre ILIKE $1 OR cedula ILIKE $1
            ORDER BY nombre
            LIMIT 20
        `;
        const { rows } = await pool.query(query, [`%${termino}%`]);
        return rows;
    } catch (error) {
        console.error('Error en buscarPorTermino:', error);
        return [];
    }
}

async function obtenerPorId(id) {
    try {
        const query = `
            SELECT 
                a.asambleista_id AS id,
                a.cedula,
                a.nombre,
                a.correo_institucional AS correo,
                COALESCE(cs.nombre, 'Sin sector') AS sector,
                CASE 
                    WHEN n.fecha_fin IS NULL AND n.estado = 'ACTIVO' THEN true
                    ELSE false
                END AS vigente,
                n.fecha_inicio,
                n.fecha_fin
            FROM asambleista a
            LEFT JOIN nombramiento n 
                ON a.asambleista_id = n.asambleista_id AND n.estado = 'ACTIVO'
            LEFT JOIN catalogo_sector cs 
                ON n.sector_id = cs.id_sector
            WHERE a.asambleista_id = $1
            LIMIT 1
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        return null;
    }
}

async function listarTodos() {
    try {
        const query = `
            SELECT 
                a.asambleista_id AS id,
                a.cedula,
                a.nombre,
                a.correo_institucional AS correo,
                COALESCE(cs.nombre, 'Sin sector') AS sector,
                CASE 
                    WHEN n.fecha_fin IS NULL AND n.estado = 'ACTIVO' THEN true
                    ELSE false
                END AS vigente
            FROM asambleista a
            LEFT JOIN nombramiento n ON a.asambleista_id = n.asambleista_id AND n.estado = 'ACTIVO'
            LEFT JOIN catalogo_sector cs ON n.sector_id = cs.id_sector
            ORDER BY a.nombre
        `;
        const { rows } = await pool.query(query);
        return rows;
    } catch (error) {
        console.error('Error en listarTodos:', error);
        return [];
    }
}

async function crearAsambleista(cedula, nombre, correo) {
    try {
        const query = `
            INSERT INTO asambleista (cedula, nombre, correo_institucional)
            VALUES ($1, $2, $3)
            RETURNING asambleista_id AS id, cedula, nombre, correo_institucional AS correo
        `;
        const { rows } = await pool.query(query, [cedula, nombre, correo]);
        return rows[0];
    } catch (error) {
        console.error('Error en crearAsambleista:', error);
        throw error;
    }
}

async function actualizarAsambleista(id, cedula, nombre, correo) {
    try {
        const query = `
            UPDATE asambleista
            SET cedula = $1, nombre = $2, correo_institucional = $3
            WHERE asambleista_id = $4
            RETURNING asambleista_id AS id, cedula, nombre, correo_institucional AS correo
        `;
        const { rows } = await pool.query(query, [cedula, nombre, correo, id]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error en actualizarAsambleista:', error);
        throw error;
    }
}

async function eliminarAsambleista(id) {
    try {
        const checkQuery = `SELECT COUNT(*) FROM nombramiento WHERE asambleista_id = $1`;
        const { rows: countRows } = await pool.query(checkQuery, [id]);
        if (parseInt(countRows[0].count) > 0) {
            throw new Error('No se puede eliminar un asambleísta con nombramientos registrados.');
        }
        const deleteQuery = `DELETE FROM asambleista WHERE asambleista_id = $1 RETURNING asambleista_id`;
        const { rows } = await pool.query(deleteQuery, [id]);
        return rows.length > 0;
    } catch (error) {
        console.error('Error en eliminarAsambleista:', error);
        throw error;
    }
}

module.exports = {
    buscarPorTermino,
    obtenerPorId,
    listarTodos,
    crearAsambleista,
    actualizarAsambleista,
    eliminarAsambleista
};