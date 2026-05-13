require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

function generarToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

function verificarToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generarToken, verificarToken };