// Genera el hash SHA-256 del contenido
// de una certificación para garantizar
// que no fue alterada después de emitirse.

const crypto = require('crypto');

// Recibe un objeto con los datos de la certificación
// y devuelve su hash SHA-256 como string hexadecimal
function generarHash(contenido) {
  const texto = JSON.stringify(contenido);
  return crypto.createHash('sha256').update(texto).digest('hex');
}

// Verifica que el hash guardado coincida con el contenido actual
function verificarHash(contenido, hashGuardado) {
  const hashActual = generarHash(contenido);
  return hashActual === hashGuardado;
}

module.exports = { generarHash, verificarHash };