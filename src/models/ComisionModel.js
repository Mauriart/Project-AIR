const db = require('../config/db');

const crearComision = async (
    nombre,
    descripcion
) => {

    const query = `
        INSERT INTO comision (
            nombre,
            descripcion
        )
        VALUES ($1, $2)
        RETURNING *;
    `;

    const values = [
        nombre,
        descripcion
    ];

    const result =
    await db.query(query, values);

    return result.rows[0];
};

const listarComisiones = async () => {

    const query = `
        SELECT *
        FROM comision
        ORDER BY id_comision DESC;
    `;

    const result =
    await db.query(query);

    return result.rows;
};

const agregarIntegrante = async (
    id_comision,
    asambleista_id,
    rol,
    fecha_inicio,
    fecha_fin
) => {

    const query = `
        INSERT INTO integrante_comision (
            id_comision,
            asambleista_id,
            rol,
            fecha_inicio,
            fecha_fin
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        id_comision,
        asambleista_id,
        rol,
        fecha_inicio,
        fecha_fin
    ];

    const result =
    await db.query(query, values);

    return result.rows[0];
};

const registrarAsistencia = async (
    id_sesion,
    asambleista_id,
    estado_asistencia
) => {

    const query = `
        INSERT INTO asistencia_sesion_comision (
            id_sesion,
            asambleista_id,
            estado_asistencia
        )
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const values = [
        id_sesion,
        asambleista_id,
        estado_asistencia
    ];

    const result =
    await db.query(query, values);

    return result.rows[0];
};

const obtenerIntegrantes = async (idComision) => {

    const query = `

        SELECT

            ic.id_integrante,
            ic.rol,
            ic.estado,
            ic.fecha_inicio,
            ic.fecha_fin,

            a.asambleista_id,
            a.nombre,
            a.cedula

        FROM integrante_comision ic

        INNER JOIN asambleista a
            ON ic.asambleista_id = a.asambleista_id

        WHERE ic.id_comision = $1

        ORDER BY a.nombre;

    `;

    const result =
        await pool.query(query, [idComision]);

    return result.rows;
};

module.exports = {
    crearComision,
    listarComisiones,
    agregarIntegrante,
    registrarAsistencia,
    obtenerIntegrantes
};