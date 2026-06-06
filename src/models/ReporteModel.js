const pool = require('../config/db');

// Consulta las metricas administrativas desde las vistas SQL.
async function obtenerMetricasCertificaciones() {
  const [porMes, porSector, foliosPorAnio] = await Promise.all([
    pool.query(`
      SELECT anio, mes, periodo, total_certificaciones
      FROM vw_reporte_certificaciones_mes
      ORDER BY anio DESC, mes DESC
    `),
    pool.query(`
      SELECT sector, total_certificaciones
      FROM vw_reporte_certificaciones_sector
      ORDER BY total_certificaciones DESC, sector
    `),
    pool.query(`
      SELECT anio, total_folios
      FROM vw_reporte_folios_anio
      ORDER BY anio DESC
    `)
  ]);

  return {
    certificaciones_por_mes: porMes.rows,
    certificaciones_por_sector: porSector.rows,
    folios_por_anio: foliosPorAnio.rows
  };
}

// Calcula el porcentaje global de asistencia de un asambleista.
async function obtenerPorcentajeAsistencia(id_asambleista) {
  const resultado = await pool.query(`
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          (
            COUNT(*) FILTER (WHERE LOWER(cea.nombre) = 'presente')::NUMERIC
            / COUNT(*)::NUMERIC
          ) * 100,
          2
        )
      END AS porcentaje_asistencia
    FROM asistencia_sesion_plenaria asp
    JOIN catalogo_estado_asistencia cea
      ON asp.id_estado_asistencia = cea.id_estado_asistencia
    WHERE asp.id_asambleista = $1
  `, [id_asambleista]);

  return resultado.rows[0]?.porcentaje_asistencia || 0;
}

// Obtiene las filas que se exportan como aportes administrativos.
async function obtenerAportesAsambleista(id_asambleista) {
  const porcentaje = await obtenerPorcentajeAsistencia(id_asambleista);

  const resultado = await pool.query(`
    SELECT
      c.folio_unico AS folio,
      TO_CHAR(c.fecha_emision, 'YYYY-MM-DD') AS fecha,
      a.nombre AS asambleista,
      COALESCE(
        STRING_AGG(DISTINCT p.titulo, ' | ' ORDER BY p.titulo),
        'Sin propuestas asociadas'
      ) AS propuestas,
      $2::NUMERIC AS porcentaje_asistencia
    FROM certificacion_emitida c
    JOIN asambleista a
      ON c.id_asambleista = a.asambleista_id
    LEFT JOIN resolucion_propuesta rp
      ON rp.fecha_emision <= c.fecha_emision::DATE
    LEFT JOIN punto_agenda pa
      ON rp.id_punto_agenda = pa.id_punto_agenda
    LEFT JOIN propuesta p
      ON pa.id_propuesta = p.id_propuesta
    WHERE c.id_asambleista = $1
    GROUP BY
      c.id_certificacion,
      c.folio_unico,
      c.fecha_emision,
      a.nombre
    ORDER BY c.fecha_emision DESC
  `, [id_asambleista, porcentaje]);

  return resultado.rows;
}

module.exports = {
  obtenerMetricasCertificaciones,
  obtenerAportesAsambleista
};
