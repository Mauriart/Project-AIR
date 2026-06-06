require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar middlewares y controladores
const { verificarAutenticacion, requierePermiso } = require('./src/controllers/AuthController');
const authRoutes = require('./src/controllers/AuthController');
const normativaRoutes = require('./src/controllers/NormativaController');
const certificacionRoutes = require('./src/controllers/CertificacionController');
const asambleistaController = require('./src/controllers/asambleistaController');
const sesionRoutes = require('./src/controllers/SesionController');
const votacionRoutes = require('./src/controllers/VotacionController');

// Rutas públicas / autenticación
app.use('/auth', authRoutes);
app.use('/normativa', normativaRoutes);
app.use('/certificaciones', certificacionRoutes);
app.use('/sesiones', sesionRoutes);
app.use('/votaciones', votacionRoutes);

// Rutas buscador
app.get('/api/asambleistas/buscar', verificarAutenticacion, asambleistaController.buscarAsambleistas);
app.get('/api/asambleistas/:id', verificarAutenticacion, asambleistaController.obtenerAsambleistaPorId);
app.post('/api/asambleistas/consultar', verificarAutenticacion, asambleistaController.consultarCertificacion);

// Rutas asableistas
app.get('/api/asambleistas', verificarAutenticacion, asambleistaController.listarAsambleistas);
app.post('/api/asambleistas', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.crearAsambleista);
app.put('/api/asambleistas/:id', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.actualizarAsambleista);
app.delete('/api/asambleistas/:id', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.eliminarAsambleista);

// Rutas nombramientos
app.get('/api/asambleistas/:id/nombramientos', verificarAutenticacion, asambleistaController.listarNombramientos);
app.get('/api/nombramientos/:id', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.obtenerNombramientoPorId);
app.post('/api/asambleistas/:id/nombramientos', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.crearNombramiento);
app.put('/api/nombramientos/:id', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.actualizarNombramiento);
app.delete('/api/nombramientos/:id', verificarAutenticacion, requierePermiso('GESTIONAR_ASAMBLEISTAS'), asambleistaController.eliminarNombramiento);

// Rutas vistas
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/login.html'));
});

app.get('/buscador', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/buscador.html'));
});

app.get('/asambleistas', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/buscador.html'));
});

app.get('/propuesta-nueva', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/propuesta-nueva.view.html'));
});

app.get('/preview-certificacion', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/certificacion-preview.html'));
});

app.get('/test-protegido', verificarAutenticacion, (req, res) => {
    res.json({ ok: true, mensaje: `Hola ${req.usuario.username}` });
});

app.get('/asistencia', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/sesion-asistencia.view.html'));
});

app.get('/votaciones-tablero', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/votacion-tablero.view.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor AIR corriendo en http://localhost:${PORT}`);
});