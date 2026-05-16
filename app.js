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
const buscadorRoutes = require('./src/controllers/BuscadorRoutes');
const certificacionRoutes = require('./src/controllers/CertificacionController');

// Registrar rutas
app.use('/auth', authRoutes);
app.use('/normativa', normativaRoutes);
app.use('/api/asambleistas', buscadorRoutes);
app.use('/api/certificaciones', certificacionRoutes);

// Rutas de vistas
app.get('/propuesta-nueva', verificarAutenticacion, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/propuesta-nueva.view.html'));
});

//Ruta de buscador (Issue #3)
app.get('/buscador', verificarAutenticacion, (req, res) => { 
  res.sendFile(path.join(__dirname, 'src/views/buscador.html'));
});

//Ruta de buscador de isssue #1
app.get('/preview-certificacion', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'src/views/certificacion-preview.html'
    )
  );
});

// Ruta de prueba
app.get('/test-protegido', verificarAutenticacion, (req, res) => {
  res.json({ ok: true, mensaje: `Hola ${req.usuario.username}` });
});


app.listen(PORT, () => {
  console.log(`Servidor AIR corriendo en http://localhost:${PORT}`);
});


