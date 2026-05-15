require('dotenv').config();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas y middlewares
const authRoutes = require('./src/controllers/AuthController');
const { verificarAutenticacion } = require('./src/controllers/AuthController');
const normativaRoutes = require('./src/controllers/NormativaController');

// Registrar rutas
app.use('/auth', authRoutes);
app.use('/normativa', normativaRoutes);

// Rutas de vistas
app.get('/propuesta-nueva', verificarAutenticacion, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/propuesta-nueva.view.html'));
});

// Ruta de prueba
app.get('/test-protegido', verificarAutenticacion, (req, res) => {
  res.json({ ok: true, mensaje: `Hola ${req.usuario.username}` });
});

app.listen(PORT, () => {
  console.log(`Servidor AIR corriendo en http://localhost:${PORT}`);
});