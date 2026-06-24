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
    // 1. Siempre obtener datos básicos del asambleísta
    const queryAsambleista = `
        SELECT 
            a.asambleista_id,
            a.nombre,
            a.cedula,
            a.correo_institucional,
            cs.nombre AS sector_nombre,
            n.fecha_inicio AS nombramiento_inicio,
            n.fecha_fin AS nombramiento_fin
        FROM asambleista a
        LEFT JOIN nombramiento n ON a.asambleista_id = n.asambleista_id AND n.estado = 'ACTIVO'
        LEFT JOIN catalogo_sector cs ON n.sector_id = cs.id_sector
        WHERE a.asambleista_id = $1
    `;
    const resultAsambleista = await pool.query(queryAsambleista, [asambleistaId]);
    if (resultAsambleista.rows.length === 0) {
        return []; // asambleísta no existe
    }
    const asambleista = resultAsambleista.rows[0];

    // 2. Obtener datos de la vista (con filtro de fechas, si existe)
    let queryVista = `
        SELECT * FROM vista_certificacion 
        WHERE asambleista_id = $1
    `;
    const params = [asambleistaId];
    if (fechaInicio && fechaFin) {
        queryVista += ` AND sesion_fecha BETWEEN $2 AND $3`;
        params.push(fechaInicio, fechaFin);
    }
    queryVista += ` ORDER BY sesion_fecha DESC`;
    const resultVista = await pool.query(queryVista, params);

    // 3. Si la vista devuelve datos, usar esos; si no, crear una fila base con los datos del asambleísta
    if (resultVista.rows.length > 0) {
        return resultVista.rows;
    } else {
        // Crear una fila con los datos del asambleísta y campos NULL para propuestas
        return [{
            asambleista_id: asambleista.asambleista_id,
            nombre: asambleista.nombre,
            cedula: asambleista.cedula,
            correo_institucional: asambleista.correo_institucional,
            sector_nombre: asambleista.sector_nombre || 'Sin sector',
            nombramiento_inicio: asambleista.nombramiento_inicio,
            nombramiento_fin: asambleista.nombramiento_fin,
            id_propuesta: null,
            titulo: null,
            codigo_air: null,
            origen: null,
            numero_sesion: null,
            sesion_fecha: null,
            total_asistencias_plenarias: 0   // o lo que corresponda
        }];
    }
};

const emitirCertificacion = async (id_asambleista, usuario_secretaria, hash) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO certificacion_emitida 
             (id_asambleista, hash_seguridad, usuario_secretaria, fecha_emision)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
            [id_asambleista, hash, usuario_secretaria]
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
