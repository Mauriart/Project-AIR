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

const eliminarIntegrante = async (idIntegrante) => {

    const query = `
        DELETE FROM integrante_comision
        WHERE id_integrante = $1
    `;

    await db.query(query, [idIntegrante]);
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
        ON CONFLICT (id_sesion, asambleista_id)
        DO UPDATE SET
            estado_asistencia = EXCLUDED.estado_asistencia
        RETURNING *;
    `;

    const values = [
        id_sesion,
        asambleista_id,
        estado_asistencia
    ];

    const result = await db.query(query, values);

    return result.rows[0];
};

const obtenerAsistenciaSesion = async (idSesion) => {

    const query = `
        SELECT
            asambleista_id,
            estado_asistencia
        FROM asistencia_sesion_comision
        WHERE id_sesion = $1;
    `;

    const result = await db.query(query, [idSesion]);

    return result.rows;
};

const obtenerPorcentajeAsistencia = async (idComision) => {

    const query = `
        SELECT
            a.asambleista_id,
            a.nombre,
            a.cedula,
            COUNT(ascm.id_asistencia) AS total_registros,
            SUM(
                CASE
                    WHEN ascm.estado_asistencia = 'Presente' THEN 1
                    ELSE 0
                END
            ) AS total_presentes,
            ROUND(
                (
                    SUM(
                        CASE
                            WHEN ascm.estado_asistencia = 'Presente' THEN 1
                            ELSE 0
                        END
                    )::numeric
                    / NULLIF(COUNT(ascm.id_asistencia), 0)
                ) * 100,
                2
            ) AS porcentaje_asistencia
        FROM integrante_comision ic
        INNER JOIN asambleista a
            ON ic.asambleista_id = a.asambleista_id
        LEFT JOIN asistencia_sesion_comision ascm
            ON ascm.asambleista_id = a.asambleista_id
        LEFT JOIN sesion_comision sc
            ON ascm.id_sesion = sc.id_sesion
            AND sc.id_comision = ic.id_comision
        WHERE ic.id_comision = $1
        GROUP BY
            a.asambleista_id,
            a.nombre,
            a.cedula
        ORDER BY a.nombre;
    `;

    const result = await db.query(query, [idComision]);

    return result.rows;
};

const actualizarIntegrante = async (
    idIntegrante,
    rol,
    estado,
    fecha_fin
) => {

    const query = `
        UPDATE integrante_comision
        SET
            rol = $1,
            estado = $2,
            fecha_fin = $3
        WHERE id_integrante = $4
        RETURNING *;
    `;

    const result = await db.query(
        query,
        [
            rol,
            estado,
            fecha_fin,
            idIntegrante
        ]
    );

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
        await db.query(query, [idComision]);

    return result.rows;
};

const eliminarComision = async (id) => {

    const query = `
        DELETE FROM comision
        WHERE id_comision = $1
    `;

    await db.query(query, [id]);
};

const crearSesion = async (
    idComision,
    fecha,
    descripcion
) => {

    const query = `
        INSERT INTO sesion_comision (
            id_comision,
            fecha,
            descripcion
        )
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const result = await db.query(
        query,
        [idComision, fecha, descripcion]
    );

    return result.rows[0];
};

const listarSesiones = async (idComision) => {

    const query = `
        SELECT *
        FROM sesion_comision
        WHERE id_comision = $1
        ORDER BY fecha DESC;
    `;

    const result = await db.query(
        query,
        [idComision]
    );

    return result.rows;
};

const eliminarSesion = async (idSesion) => {

    const query = `
        DELETE FROM sesion_comision
        WHERE id_sesion = $1
    `;

    await db.query(query, [idSesion]);
};

module.exports = {
    crearComision,
    listarComisiones,
    agregarIntegrante,
    registrarAsistencia,
    obtenerIntegrantes,
    eliminarComision,
    eliminarIntegrante,
    actualizarIntegrante,
    crearSesion,
    listarSesiones,
    eliminarSesion,
    obtenerAsistenciaSesion,
    obtenerPorcentajeAsistencia
};