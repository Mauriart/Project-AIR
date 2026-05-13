require('dotenv').config();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const authRoutes = require('./src/controllers/AuthController');
app.use('/auth', authRoutes);

// Validar que el token esté bien
const { verificarAutenticacion } = require('./src/controllers/AuthController');
app.get('/test-protegido', verificarAutenticacion, (req, res) => {
  res.json({ ok: true, mensaje: `Hola ${req.usuario.username}` });
});

app.listen(PORT, () => {
  console.log(`Servidor AIR corriendo en http://localhost:${PORT}`);
});