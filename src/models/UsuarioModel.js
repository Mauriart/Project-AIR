const db = require('../config/db');

// Busca un usuario por su username
async function buscarPorUsername(username) {
  const resultado = await db.query(
    `SELECT id_usuario, username, password_hash, activo
     FROM sys_usuario
     WHERE username = $1`,
    [username]
  );
  return resultado.rows[0] || null;
}

// Obtiene los roles de un usuario
async function obtenerRoles(id_usuario) {
  const resultado = await db.query(
    `SELECT r.nombre_rol
     FROM sys_rol r
     JOIN sys_usuario_rol ur ON r.id_rol = ur.id_rol
     WHERE ur.id_usuario = $1`,
    [id_usuario]
  );
  return resultado.rows.map(r => r.nombre_rol);
}

// Registra una acción en la bitácora
async function registrarLog(id_usuario, accion, tabla, detalle, ip = null) {
  await db.query(
    `INSERT INTO sys_log_auditoria
       (id_usuario, accion, tabla_afectada, detalle, registro_id, ip_origen)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id_usuario, accion, tabla, detalle, null, ip]
  );
}

module.exports = {
  buscarPorUsername,
  obtenerRoles,
  registrarLog,
};