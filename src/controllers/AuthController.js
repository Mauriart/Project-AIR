const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();

const { generarToken, verificarToken } = require('../config/security');
const UsuarioModel = require('../models/UsuarioModel');

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress; // captura la IP

  if (!username || !password) {
    return res.status(400).json({ ok: false, mensaje: 'Usuario y contraseña son requeridos' });
  }

  try {
    const usuario = await UsuarioModel.buscarPorUsername(username);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordCorrecta) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    const roles = await UsuarioModel.obtenerRoles(usuario.id_usuario);
    const permisos = await UsuarioModel.obtenerPermisos(usuario.id_usuario);

    const token = generarToken({
      id_usuario: usuario.id_usuario,
      username:   usuario.username,
      roles:      roles,
      permisos:   permisos
    });

    await UsuarioModel.registrarLog(
      usuario.id_usuario, 'LOGIN', 'sys_usuario',
      `Inicio de sesion: ${username}`, ip
    );

    return res.status(200).json({ ok: true, token, roles, permisos, mensaje: 'Login exitoso' });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// POST /auth/logout
router.post('/logout', verificarAutenticacion, (req, res) => {
  return res.status(200).json({ ok: true, mensaje: 'Sesion cerrada.' });
});

// MIDDLEWARE: bloquea rutas sin token
function verificarAutenticacion(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Acceso denegado. Token requerido.' });
  }

  try {
    const datos = verificarToken(token);
    req.usuario = datos;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Token invalido o expirado' });
  }
}

// MIDDLEWARE: verifica rol específico
function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    const rolesUsuario = req.usuario?.roles || [];
    const tieneRol = rolesPermitidos.some(r => rolesUsuario.includes(r));
    if (!tieneRol) {
      return res.status(403).json({ ok: false, mensaje: 'No tenes permisos para esta accion' });
    }
    next();
  };
}

// MIDDLEWARE: verifica permisos efectivos cargados en el token
function requierePermiso(...permisosPermitidos) {
  return (req, res, next) => {
    const permisosUsuario = req.usuario?.permisos || [];
    const tienePermiso = permisosPermitidos.some(p => permisosUsuario.includes(p));
    if (!tienePermiso) {
      return res.status(403).json({ ok: false, mensaje: 'No tenes permisos para esta accion' });
    }
    next();
  };
}

module.exports = router;
module.exports.verificarAutenticacion = verificarAutenticacion;
module.exports.requiereRol = requiereRol;
module.exports.requierePermiso = requierePermiso;
