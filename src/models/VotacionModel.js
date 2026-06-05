const db = require('../config/db');

// Registra una votación y actualiza el estado de la propuesta
async function registrarVotacion(datos) {
  const {
    id_sesion, id_propuesta,
    votos_favor, votos_contra, abstenciones
  } = datos;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener el tipo de mayoría requerida de la propuesta
    const propuesta = await client.query(`
      SELECT id_tipo_mayoria_requerida
      FROM propuesta
      WHERE id_propuesta = $1
    `, [id_propuesta]);

    if (propuesta.rows.length === 0) {
      throw new Error('Propuesta no encontrada');
    }

    const id_tipo_mayoria = propuesta.rows[0].id_tipo_mayoria_requerida;

    // 2. Calcular el resultado usando la función de la BD
    const resultadoQuery = await client.query(`
      SELECT calcular_resultado_votacion($1, $2, $3, $4) AS resultado
    `, [votos_favor, votos_contra, id_sesion, id_tipo_mayoria]);

    const resultado = resultadoQuery.rows[0].resultado;

    // 3. Insertar la votación
    const votacion = await client.query(`
      INSERT INTO votacion_acuerdo
        (id_sesion, id_propuesta, votos_favor, votos_contra, abstenciones, resultado)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id_sesion, id_propuesta)
      DO UPDATE SET
        votos_favor  = EXCLUDED.votos_favor,
        votos_contra = EXCLUDED.votos_contra,
        abstenciones = EXCLUDED.abstenciones,
        resultado    = EXCLUDED.resultado
      RETURNING *
    `, [id_sesion, id_propuesta, votos_favor, votos_contra, abstenciones, resultado]);

    // 4. Actualizar el estado de la propuesta
    const id_estado = resultado === 'Aprobada' ? 3 : 4; // 3=Aprobada, 4=Rechazada
    await client.query(`
      UPDATE propuesta
      SET id_estado_propuesta = $1
      WHERE id_propuesta = $2
    `, [id_estado, id_propuesta]);

    await client.query('COMMIT');
    return { ...votacion.rows[0], resultado };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Firma una votación — después no se puede modificar
async function firmarVotacion(id_votacion) {
  const resultado = await db.query(`
    UPDATE votacion_acuerdo
    SET es_firme = TRUE
    WHERE id_votacion = $1
      AND es_firme = FALSE
    RETURNING *
  `, [id_votacion]);

  if (resultado.rows.length === 0) {
    throw new Error('Votación no encontrada o ya firmada');
  }

  return resultado.rows[0];
}

// Obtiene todas las votaciones de una sesión
async function obtenerVotacionesSesion(id_sesion) {
  const resultado = await db.query(`
    SELECT
      v.id_votacion,
      v.votos_favor,
      v.votos_contra,
      v.abstenciones,
      v.resultado,
      v.es_firme,
      v.fecha_votacion,
      p.titulo AS propuesta,
      p.codigo_air,
      tm.nombre AS tipo_mayoria
    FROM votacion_acuerdo v
    JOIN propuesta p ON v.id_propuesta = p.id_propuesta
    JOIN catalogo_tipo_mayoria_requerida tm
      ON p.id_tipo_mayoria_requerida = tm.id_tipo_mayoria_requerida
    WHERE v.id_sesion = $1
    ORDER BY v.fecha_votacion DESC
  `, [id_sesion]);

  return resultado.rows;
}

// Obtiene las propuestas agendadas en una sesión disponibles para votar
async function obtenerPropuestasParaVotar(id_sesion) {
  const resultado = await db.query(`
    SELECT
      p.id_propuesta,
      p.titulo,
      p.codigo_air,
      tm.nombre AS tipo_mayoria,
      ep.nombre AS estado_actual,
      -- Si ya tiene votación registrada la incluye
      v.id_votacion,
      v.resultado AS resultado_actual,
      v.es_firme
    FROM punto_agenda pa
    JOIN propuesta p ON pa.id_propuesta = p.id_propuesta
    JOIN catalogo_tipo_mayoria_requerida tm
      ON p.id_tipo_mayoria_requerida = tm.id_tipo_mayoria_requerida
    JOIN catalogo_estado_propuesta ep
      ON p.id_estado_propuesta = ep.id_estado_propuesta
    LEFT JOIN votacion_acuerdo v
      ON v.id_propuesta = p.id_propuesta AND v.id_sesion = $1
    WHERE pa.id_sesion = $1
    ORDER BY pa.orden
  `, [id_sesion]);

  return resultado.rows;
}

module.exports = {
  registrarVotacion,
  firmarVotacion,
  obtenerVotacionesSesion,
  obtenerPropuestasParaVotar
};