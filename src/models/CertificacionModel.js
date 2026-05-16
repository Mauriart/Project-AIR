const pool = require('../config/db');

const obtenerSiguienteFolio = async () => {
    const query = `
        SELECT fn_preview_siguiente_folio() AS folio;
    `;

    const result = await pool.query(query);

    return result.rows[0];
};

module.exports = {
    obtenerSiguienteFolio
};