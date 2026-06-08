const pool = require('../config/db');

const obtenerSiguienteFolio = async () => {
    const query = `
        SELECT fn_preview_siguiente_folio() AS folio;
    `;

    const result = await pool.query(query);

    return result.rows[0].folio;
};

const obtenerCertificaciones = async (filtros = {}) => {
  const { id_asambleista, fecha_desde, fecha_hasta } = filtros;

  let query = `
    SELECT
      c.id_certificacion,
      c.folio_unico,
      c.hash_seguridad,
      c.fecha_emision,
      c.usuario_secretaria,
      a.nombre AS asambleista,
      a.cedula,
      CASE WHEN an.id_anulacion IS NOT NULL
        THEN TRUE ELSE FALSE
      END AS anulada,
      an.motivo AS motivo_anulacion
    FROM certificacion_emitida c
    JOIN asambleista a ON c.id_asambleista = a.asambleista_id
    LEFT JOIN anulacion_certificacion an ON c.id_certificacion = an.id_certificacion
    WHERE 1=1
  `;

  const params = [];
  if (id_asambleista) { params.push(id_asambleista); query += ` AND c.id_asambleista = $${params.length}`; }
  if (fecha_desde)    { params.push(fecha_desde);    query += ` AND c.fecha_emision >= $${params.length}`; }
  if (fecha_hasta)    { params.push(fecha_hasta);     query += ` AND c.fecha_emision <= $${params.length}`; }
  query += ` ORDER BY c.fecha_emision DESC`;

  const resultado = await pool.query(query, params);
  return resultado.rows;
};

const obtenerPorFolio = async (folio) => {
  const resultado = await pool.query(`
    SELECT
      c.id_certificacion, c.folio_unico, c.hash_seguridad,
      c.fecha_emision, c.usuario_secretaria,
      a.nombre AS asambleista, a.cedula,
      CASE WHEN an.id_anulacion IS NOT NULL THEN TRUE ELSE FALSE END AS anulada,
      an.motivo AS motivo_anulacion
    FROM certificacion_emitida c
    JOIN asambleista a ON c.id_asambleista = a.asambleista_id
    LEFT JOIN anulacion_certificacion an ON c.id_certificacion = an.id_certificacion
    WHERE c.folio_unico = $1
  `, [folio]);
  return resultado.rows[0] || null;
};

const obtenerDatosCertificacion = async (asambleistaId, fechaInicio = null, fechaFin = null) => {
    let query = `
        SELECT * FROM vista_certificacion 
        WHERE asambleista_id = $1
    `;
    const params = [asambleistaId];
    if (fechaInicio && fechaFin) {
        query += ` AND sesion_fecha BETWEEN $2 AND $3`;
        params.push(fechaInicio, fechaFin);
    }
    query += ` ORDER BY sesion_fecha DESC`;
    const result = await pool.query(query, params);
    return result.rows;
};

const generarFolio = async (client) => {
    const anio = new Date().getFullYear();
    let res = await client.query(
        `SELECT ultimo_numero FROM control_folio WHERE anio = $1 FOR UPDATE`,
        [anio]
    );
    let nuevoNumero;
    if (res.rows.length > 0) {
        nuevoNumero = res.rows[0].ultimo_numero + 1;
        await client.query(
            `UPDATE control_folio SET ultimo_numero = $1 WHERE anio = $2`,
            [nuevoNumero, anio]
        );
    } else {
        nuevoNumero = 1;
        await client.query(
            `INSERT INTO control_folio (anio, ultimo_numero) VALUES ($1, $2)`,
            [anio, nuevoNumero]
        );
    }
    const folio = `DAIR-${String(nuevoNumero).padStart(3, '0')}-${anio}`;
    return folio;
};

const emitirCertificacion = async (id_asambleista, usuario_secretaria, hash) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1 generar folio seguro
        const folio = await generarFolio(client);
        // 2 insertar certificación con el folio generado
        const result = await client.query(
            `INSERT INTO certificacion_emitida 
             (id_asambleista, folio_unico, hash_seguridad, usuario_secretaria, fecha_emision)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [id_asambleista, folio, hash, usuario_secretaria]
        );
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const anularCertificacion = async (id_certificacion, motivo, usuario_anula) => {
  const existente = await pool.query(`
    SELECT id_anulacion FROM anulacion_certificacion WHERE id_certificacion = $1
  `, [id_certificacion]);

  if (existente.rows.length > 0) throw new Error('Esta certificación ya fue anulada');

  const resultado = await pool.query(`
    INSERT INTO anulacion_certificacion (id_certificacion, motivo, usuario_anula)
    VALUES ($1, $2, $3) RETURNING *
  `, [id_certificacion, motivo, usuario_anula]);
  return resultado.rows[0];
};

module.exports = {
  obtenerSiguienteFolio,
  obtenerCertificaciones,
  obtenerPorFolio,
  emitirCertificacion,
  anularCertificacion,
  obtenerDatosCertificacion
};
