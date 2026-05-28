const db = require('../config/db');

// Obtiene todas las sesiones con su tipo y modalidad
async function obtenerSesiones() {
  const resultado = await db.query(`
    SELECT
      s.id_sesion,
      s.numero_sesion,
      s.fecha,
      s.quorum,
      ts.nombre AS tipo_sesion,
      tm.nombre AS modalidad
    FROM sesiones s
    JOIN catalogo_tipo_sesion ts ON s.id_tipo_sesion = ts.id_tipo_sesion
    JOIN catalogo_tipo_modalidad tm ON s.id_tipo_modalidad = tm.id_tipo_modalidad
    ORDER BY s.fecha DESC
  `);
  return resultado.rows;
}

// Obtiene una sesión por ID
async function obtenerSesionPorId(id_sesion) {
  const resultado = await db.query(`
    SELECT
      s.id_sesion,
      s.numero_sesion,
      s.fecha,
      s.quorum,
      ts.nombre AS tipo_sesion,
      tm.nombre AS modalidad
    FROM sesiones s
    JOIN catalogo_tipo_sesion ts ON s.id_tipo_sesion = ts.id_tipo_sesion
    JOIN catalogo_tipo_modalidad tm ON s.id_tipo_modalidad = tm.id_tipo_modalidad
    WHERE s.id_sesion = $1
  `, [id_sesion]);
  return resultado.rows[0] || null;
}

// Crea una nueva sesión
async function crearSesion(datos) {
  const {
    id_tipo_modalidad, id_tipo_sesion,
    numero_sesion, fecha, quorum, link_acta
  } = datos;

  const resultado = await db.query(`
    INSERT INTO sesiones
      (id_tipo_modalidad, id_tipo_sesion, numero_sesion, fecha, quorum, link_acta)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [id_tipo_modalidad, id_tipo_sesion, numero_sesion, fecha, quorum, link_acta || null]);

  return resultado.rows[0];
}

// Obtiene todos los asambleístas activos para el pase de lista
async function obtenerAsambleistasPadron() {
  const resultado = await db.query(`
    SELECT DISTINCT
      a.asambleista_id,
      a.nombre,
      a.cedula,
      cs.nombre AS sector
    FROM asambleista a
    JOIN nombramiento n ON a.asambleista_id = n.asambleista_id
    JOIN catalogo_sector cs ON n.sector_id = cs.id_sector
    WHERE n.estado = 'ACTIVO'
    ORDER BY a.nombre
  `);
  return resultado.rows;
}

// Registra la asistencia de todos los asambleístas de una sesión
async function registrarAsistencia(id_sesion, asistencias) {
  // asistencias = [{ id_asambleista, id_estado_asistencia }, ...]
  // Usamos una transacción para que todo entre junto o nada
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    for (const a of asistencias) {
      await client.query(`
        INSERT INTO asistencia_sesion_plenaria
          (id_asambleista, id_sesion, id_estado_asistencia)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_asambleista, id_sesion)
        DO UPDATE SET id_estado_asistencia = EXCLUDED.id_estado_asistencia
      `, [a.id_asambleista, id_sesion, a.id_estado_asistencia]);
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Obtiene la asistencia registrada de una sesión
async function obtenerAsistenciaSesion(id_sesion) {
  const resultado = await db.query(`
    SELECT
      a.asambleista_id,
      a.nombre,
      a.cedula,
      cea.nombre AS estado_asistencia,
      cea.id_estado_asistencia
    FROM asistencia_sesion_plenaria asp
    JOIN asambleista a ON asp.id_asambleista = a.asambleista_id
    JOIN catalogo_estado_asistencia cea
      ON asp.id_estado_asistencia = cea.id_estado_asistencia
    WHERE asp.id_sesion = $1
    ORDER BY a.nombre
  `, [id_sesion]);
  return resultado.rows;
}

// Valida si una sesión tiene quórum legal
// Llama directamente a la función de la BD
async function validarQuorumLegal(id_sesion) {
  const resultado = await db.query(`
    SELECT validar_quorum_legal($1) AS tiene_quorum
  `, [id_sesion]);
  return resultado.rows[0].tiene_quorum;
}

// Obtiene el conteo de presentes vs quórum requerido
async function obtenerResumenAsistencia(id_sesion) {
  const resultado = await db.query(`
    SELECT
      s.quorum AS quorum_requerido,
      COUNT(CASE WHEN cea.nombre = 'Presente' THEN 1 END) AS total_presentes,
      COUNT(CASE WHEN cea.nombre = 'Ausente' THEN 1 END) AS total_ausentes,
      COUNT(CASE WHEN cea.nombre = 'Justificado' THEN 1 END) AS total_justificados,
      validar_quorum_legal(s.id_sesion) AS quorum_cumplido
    FROM sesiones s
    LEFT JOIN asistencia_sesion_plenaria asp ON s.id_sesion = asp.id_sesion
    LEFT JOIN catalogo_estado_asistencia cea
      ON asp.id_estado_asistencia = cea.id_estado_asistencia
    WHERE s.id_sesion = $1
    GROUP BY s.id_sesion, s.quorum
  `, [id_sesion]);
  return resultado.rows[0] || null;
}

module.exports = {
  obtenerSesiones,
  obtenerSesionPorId,
  crearSesion,
  obtenerAsambleistasPadron,
  registrarAsistencia,
  obtenerAsistenciaSesion,
  validarQuorumLegal,
  obtenerResumenAsistencia
};