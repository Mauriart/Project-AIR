// Issue #3: Controlador de buscador (datos mock)

// Datos mock (tabla asambleista + nombramiento)
const asambleistasMock = [
    { 
        id: 1, 
        cedula: "1-2345-6789", 
        nombre: "Ana Rosa Ruiz Fernández", 
        sector: "Docente", 
        vigente: true, 
        fechaInicioNombramiento: "2023-01-01", 
        fechaFinNombramiento: null 
    },
    { 
        id: 2, 
        cedula: "2-9876-5432", 
        nombre: "Luis Gómez Gutiérrez", 
        sector: "Administrativo", 
        vigente: true, 
        fechaInicioNombramiento: "2022-06-01", 
        fechaFinNombramiento: null 
    },
    { 
        id: 3, 
        cedula: "3-4567-8901", 
        nombre: "María Estrada Sánchez", 
        sector: "Estudiante", 
        vigente: false, 
        fechaInicioNombramiento: "2024-01-15", 
        fechaFinNombramiento: "2024-12-31" 
    }
];

// Endpoint: búsqueda de asambleístas (por nombre o cédula)
function buscarAsambleistas(req, res) {
    const texto = req.query.termino ? req.query.termino.toLowerCase() : '';
    if (texto.length < 2) {
        return res.json([]);
    }
    const filtrados = asambleistasMock.filter(a => 
        a.nombre.toLowerCase().includes(texto) || a.cedula.includes(texto)
    );
    res.json(filtrados);
}

// Endpoint: obtener detalle de un asambleísta por ID
function obtenerAsambleistaPorId(req, res) {
    const id = parseInt(req.params.id);
    const asambleista = asambleistasMock.find(a => a.id === id);
    if (!asambleista) {
        return res.status(404).json({ error: 'Asambleísta no encontrado' });
    }
    res.json(asambleista);
}

// Endpoint: simular consulta de certificación (para el botón "Consultar")
function simularConsultaCertificacion(req, res) {   // ← sin tilde
    const { idAsambleista, fechaDesde, fechaHasta } = req.body;
    const asambleista = asambleistasMock.find(a => a.id === parseInt(idAsambleista));
    if (!asambleista) {
        return res.status(404).json({ error: 'Asambleísta no existe' });
    }
    res.json({
        mensaje: `Consulta simulada para ${asambleista.nombre}`,
        periodo: fechaDesde ? `${fechaDesde} al ${fechaHasta}` : 'Todo el historial',
        participaciones: [
            { tipo: "Propuesta", titulo: "Políticas generales 2022-2026", fecha: "2019-04-10" },
            { tipo: "Comisión", nombre: "Comisión de Carrera Profesional", asistencia: "100%" }
        ]
    });
}

// EXPORTAR las funciones (esto es lo que faltaba)
module.exports = {
    buscarAsambleistas,
    obtenerAsambleistaPorId,
    simularConsultaCertificacion
};
