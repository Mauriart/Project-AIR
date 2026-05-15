const db = require('../config/db');

// Obtiene el árbol completo de un reglamento
// WITH RECURSIVE arma el árbol desde la raíz hacia abajo
async function obtenerArbolReglamento(id_reglamento) {
  const resultado = await db.query(`
    WITH RECURSIVE arbol AS (
      -- Punto de partida: elementos sin padre (raíz)
      SELECT
        e.id_elemento,
        e.id_elemento_padre,
        e.numero_etiqueta,
        e.contenido_texto,
        e.orden,
        n.nombre AS nivel,
        0 AS profundidad
      FROM elemento_normativo e
      JOIN catalogo_nivel_reglamento n 
        ON e.id_nivel_reglamento = n.id_nivel_reglamento
      JOIN catalogo_estado_vigencia ev 
        ON e.id_estado_vigencia = ev.id_estado_vigencia
      WHERE e.id_reglamento = $1
        AND e.id_elemento_padre IS NULL
        AND e.fecha_fin_vigencia IS NULL

      UNION ALL

      -- Recursión: busca los hijos de cada elemento
      SELECT
        e.id_elemento,
        e.id_elemento_padre,
        e.numero_etiqueta,
        e.contenido_texto,
        e.orden,
        n.nombre AS nivel,
        arbol.profundidad + 1
      FROM elemento_normativo e
      JOIN catalogo_nivel_reglamento n 
        ON e.id_nivel_reglamento = n.id_nivel_reglamento
      JOIN catalogo_estado_vigencia ev 
        ON e.id_estado_vigencia = ev.id_estado_vigencia
      JOIN arbol ON e.id_elemento_padre = arbol.id_elemento
      WHERE e.fecha_fin_vigencia IS NULL
    )
    SELECT * FROM arbol ORDER BY profundidad, orden
  `, [id_reglamento]);

  return resultado.rows;
}

// Obtiene todos los reglamentos disponibles
async function obtenerReglamentos() {
  const resultado = await db.query(`
    SELECT id_reglamento, nombre_normativa, sigla
    FROM reglamento
    ORDER BY nombre_normativa
  `);
  return resultado.rows;
}

// Crea una nueva propuesta
async function crearPropuesta(datos) {
  const {
    id_reglamento_base, id_etapa_propuesta,
    id_estado_propuesta, id_propuesta_padre,
    titulo, texto_sustitutivo, codigo_air,
    id_tipo_mayoria_requerida
  } = datos;

  const resultado = await db.query(`
    INSERT INTO propuesta (
      id_reglamento_base, id_etapa_propuesta, id_estado_propuesta,
      id_propuesta_padre, titulo, texto_sustitutivo,
      codigo_air, id_tipo_mayoria_requerida
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `, [
    id_reglamento_base, id_etapa_propuesta, id_estado_propuesta,
    id_propuesta_padre || null, titulo, texto_sustitutivo || null,
    codigo_air || null, id_tipo_mayoria_requerida
  ]);

  return resultado.rows[0];
}

// Obtiene todas las propuestas con su estado y etapa
async function obtenerPropuestas() {
  const resultado = await db.query(`
    SELECT
      p.id_propuesta,
      p.titulo,
      p.codigo_air,
      ep.nombre AS etapa,
      esp.nombre AS estado,
      r.nombre_normativa AS reglamento
    FROM propuesta p
    JOIN catalogo_etapas_propuestas ep 
      ON p.id_etapa_propuesta = ep.id_etapa_propuesta
    JOIN catalogo_estado_propuesta esp
      ON p.id_estado_propuesta = esp.id_estado_propuesta
    LEFT JOIN reglamento r 
      ON p.id_reglamento_base = r.id_reglamento
    ORDER BY p.id_propuesta DESC
  `);
  return resultado.rows;
}

// Obtiene todas las sesiones
async function obtenerSesiones() {
  const resultado = await db.query(`
    SELECT
      s.id_sesion,
      s.numero_sesion,
      s.fecha,
      ts.nombre AS tipo_sesion,
      tm.nombre AS modalidad
    FROM sesiones s
    JOIN catalogo_tipo_sesion ts ON s.id_tipo_sesion = ts.id_tipo_sesion
    JOIN catalogo_tipo_modalidad tm ON s.id_tipo_modalidad = tm.id_tipo_modalidad
    ORDER BY s.fecha DESC
  `);
  return resultado.rows;
}

module.exports = {
  obtenerArbolReglamento,
  obtenerReglamentos,
  crearPropuesta,
  obtenerPropuestas,
  obtenerSesiones
};
