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
const buscadorController = require('./src/controllers/buscadorController');

// Rutas públicas / autenticación
app.use('/auth', authRoutes);
app.use('/normativa', normativaRoutes);
app.use('/api/certificaciones', certificacionRoutes);

// Rutas buscador
app.get('/api/asambleistas/buscar', buscadorController.buscarAsambleistas);
app.get('/api/asambleistas/:id', buscadorController.obtenerAsambleistaPorId);
app.post('/api/asambleistas/consultar', buscadorController.consultarCertificacion);

// Rutas asableistas
app.get('/api/asambleistas', buscadorController.listarAsambleistas);
app.post('/api/asambleistas', buscadorController.crearAsambleista);
app.put('/api/asambleistas/:id', buscadorController.actualizarAsambleista);
app.delete('/api/asambleistas/:id', buscadorController.eliminarAsambleista);

// Rutas nombramientos
app.get('/api/asambleistas/:id/nombramientos', buscadorController.listarNombramientos);
app.post('/api/asambleistas/:id/nombramientos', buscadorController.crearNombramiento);
app.put('/api/nombramientos/:id', buscadorController.actualizarNombramiento);
app.delete('/api/nombramientos/:id', buscadorController.eliminarNombramiento);

// Rutas vistas
app.get('/buscador', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/buscador.html'));
});

app.get('/asambleistas', verificarAutenticacion, (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/buscador.html'));
});

app.get('/propuesta-nueva', verificarAutenticacion, (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/propuesta-nueva.view.html'));
});

app.get('/preview-certificacion', verificarAutenticacion, (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/certificacion-preview.html'));
});

app.get('/test-protegido', verificarAutenticacion, (req, res) => {
    res.json({ ok: true, mensaje: `Hola ${req.usuario.username}` });
});

app.listen(PORT, () => {
    console.log(`Servidor AIR corriendo en http://localhost:${PORT}`);
});