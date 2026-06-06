
function obtenerNotaCondicional(origen) {
    switch (origen) {
        case 'consejo_institucional':
            return "La Secretaría de la AIR no dispone de registros de asistencia para las propuestas en etapa de procedencia originadas por el Consejo Institucional.";
        case 'diez_porciento_asamblea':
            return "De conformidad con el Reglamento, las propuestas presentadas por al menos el 10% de los asambleístas no requieren registro de asistencia en la etapa inicial.";
        default:
            return "";
    }
}

function aplicarReglasCondicionales(propuesta) {
    if (!propuesta) return propuesta;
    return {
        ...propuesta,
        nota_legal: obtenerNotaCondicional(propuesta.origen)
    };
}

module.exports = {
    obtenerNotaCondicional,
    aplicarReglasCondicionales
};