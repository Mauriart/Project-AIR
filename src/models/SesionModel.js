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

async function obtenerCatalogosSesion() {
  const [tipos, modalidades] = await Promise.all([
    db.query(`
      SELECT id_tipo_sesion, nombre
      FROM catalogo_tipo_sesion
      ORDER BY id_tipo_sesion
    `),
    db.query(`
      SELECT id_tipo_modalidad, nombre
      FROM catalogo_tipo_modalidad
      ORDER BY id_tipo_modalidad
    `)
  ]);

  return {
    tipos_sesion: tipos.rows,
    modalidades: modalidades.rows
  };
}

async function obtenerPropuestasElegiblesAgenda() {
  const resultado = await db.query(`
    SELECT
      p.id_propuesta,
      p.titulo,
      p.codigo_air,
      cep.nombre AS estado,
      cet.nombre AS etapa
    FROM propuesta p
    JOIN catalogo_estado_propuesta cep
      ON p.id_estado_propuesta = cep.id_estado_propuesta
    JOIN catalogo_etapas_propuestas cet
      ON p.id_etapa_propuesta = cet.id_etapa_propuesta
    WHERE LOWER(cep.nombre) NOT IN ('aprobada', 'rechazada')
    ORDER BY p.id_propuesta DESC
  `);

  return resultado.rows;
}

async function obtenerAgendaSesion(id_sesion) {
  const resultado = await db.query(`
    SELECT
      pa.id_punto_agenda,
      pa.id_sesion,
      pa.id_propuesta,
      pa.orden,
      pa.descripcion,
      p.titulo AS propuesta,
      p.codigo_air,
      cep.nombre AS estado_propuesta,
      rp.id_resolucion_propuesta,
      rp.numero_resolucion,
      rp.fecha_emision
    FROM punto_agenda pa
    JOIN propuesta p ON pa.id_propuesta = p.id_propuesta
    JOIN catalogo_estado_propuesta cep
      ON p.id_estado_propuesta = cep.id_estado_propuesta
    LEFT JOIN resolucion_propuesta rp
      ON rp.id_punto_agenda = pa.id_punto_agenda
    WHERE pa.id_sesion = $1
    ORDER BY pa.orden, pa.id_punto_agenda
  `, [id_sesion]);

  return resultado.rows;
}

async function agregarPuntoAgenda(id_sesion, datos) {
  const { id_propuesta, orden, descripcion } = datos;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const sesion = await client.query(`
      SELECT id_sesion
      FROM sesiones
      WHERE id_sesion = $1
    `, [id_sesion]);

    if (sesion.rows.length === 0) {
      throw new Error('Sesion no encontrada');
    }

    const propuesta = await client.query(`
      SELECT
        p.id_propuesta,
        cep.nombre AS estado
      FROM propuesta p
      JOIN catalogo_estado_propuesta cep
        ON p.id_estado_propuesta = cep.id_estado_propuesta
      WHERE p.id_propuesta = $1
    `, [id_propuesta]);

    if (propuesta.rows.length === 0) {
      throw new Error('Propuesta no encontrada');
    }

    const estado = propuesta.rows[0].estado.toLowerCase();
    if (estado === 'aprobada' || estado === 'rechazada') {
      throw new Error('No se puede agregar a la agenda una propuesta aprobada o rechazada');
    }

    const duplicado = await client.query(`
      SELECT id_punto_agenda
      FROM punto_agenda
      WHERE id_sesion = $1
        AND id_propuesta = $2
    `, [id_sesion, id_propuesta]);

    if (duplicado.rows.length > 0) {
      throw new Error('La propuesta ya esta en la agenda de esta sesion');
    }

    const punto = await client.query(`
      INSERT INTO punto_agenda (id_sesion, id_propuesta, orden, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id_sesion, id_propuesta, orden, descripcion || null]);

    await client.query('COMMIT');
    return punto.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function registrarResolucionAgenda(id_sesion, id_punto_agenda, datos) {
  const { numero_resolucion, fecha_emision, aprobada } = datos;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const punto = await client.query(`
      SELECT
        pa.id_punto_agenda,
        pa.id_propuesta
      FROM punto_agenda pa
      WHERE pa.id_punto_agenda = $1
        AND pa.id_sesion = $2
    `, [id_punto_agenda, id_sesion]);

    if (punto.rows.length === 0) {
      throw new Error('Punto de agenda no encontrado para esta sesion');
    }

    const resolucion = await client.query(`
      INSERT INTO resolucion_propuesta
        (id_punto_agenda, numero_resolucion, fecha_emision)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id_punto_agenda, numero_resolucion, fecha_emision]);

    if (aprobada === true) {
      const estadoAprobada = await client.query(`
        SELECT id_estado_propuesta
        FROM catalogo_estado_propuesta
        WHERE LOWER(nombre) = 'aprobada'
        LIMIT 1
      `);

      if (estadoAprobada.rows.length === 0) {
        throw new Error('No existe el estado Aprobada en el catalogo');
      }

      await client.query(`
        UPDATE propuesta
        SET id_estado_propuesta = $1
        WHERE id_propuesta = $2
      `, [estadoAprobada.rows[0].id_estado_propuesta, punto.rows[0].id_propuesta]);
    }

    await client.query('COMMIT');
    return resolucion.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  obtenerCatalogosSesion,
  obtenerPropuestasElegiblesAgenda,
  obtenerAgendaSesion,
  agregarPuntoAgenda,
  registrarResolucionAgenda,
  obtenerAsambleistasPadron,
  registrarAsistencia,
  obtenerAsistenciaSesion,
  validarQuorumLegal,
  obtenerResumenAsistencia
};
