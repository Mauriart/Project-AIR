const express = require('express');
const router = express.Router();

const pool = require('../config/db');

router.get('/preview-folio', async (req, res) => {

    try {

        const query = `
            SELECT fn_preview_siguiente_folio() AS folio;
        `;

        const result = await pool.query(query);

        res.json({
            ok: true,
            folio: result.rows[0].folio
        });

    } catch (error) {

        console.error(error.message);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo folio'
        });
    }
});

module.exports = router;