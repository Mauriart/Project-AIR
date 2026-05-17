require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar middlewares y controladores
const { verificarAutenticacion } = require('./src/controllers/AuthController');
const authRoutes = require('./src/controllers/AuthController');
const normativaRoutes = require('./src/controllers/NormativaController');
const certificacionRoutes = require('./src/controllers/CertificacionController');
const asambleistaController = require('./src/controllers/asambleistaController');

// Rutas públicas / autenticación
app.use('/auth', authRoutes);
app.use('/normativa', normativaRoutes);
app.use('/api/certificaciones', certificacionRoutes);

// Rutas buscador
app.get('/api/asambleistas/buscar', asambleistaController.buscarAsambleistas);
app.get('/api/asambleistas/:id', asambleistaController.obtenerAsambleistaPorId);
app.post('/api/asambleistas/consultar', asambleistaController.consultarCertificacion);

// Rutas asableistas
app.get('/api/asambleistas', asambleistaController.listarAsambleistas);
app.post('/api/asambleistas', asambleistaController.crearAsambleista);
app.put('/api/asambleistas/:id', asambleistaController.actualizarAsambleista);
app.delete('/api/asambleistas/:id', asambleistaController.eliminarAsambleista);

// Rutas nombramientos
app.get('/api/asambleistas/:id/nombramientos', asambleistaController.listarNombramientos);
app.post('/api/asambleistas/:id/nombramientos', asambleistaController.crearNombramiento);
app.put('/api/nombramientos/:id', asambleistaController.actualizarNombramiento);
app.delete('/api/nombramientos/:id', asambleistaController.eliminarNombramiento);

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

app.listen(PORT, () => {
    console.log(`Servidor AIR corriendo en http://localhost:${PORT}`);
});
