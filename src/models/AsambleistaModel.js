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

module.exports = {
    buscarPorTermino,
    obtenerPorId
};