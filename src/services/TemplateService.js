const { aplicarReglasCondicionales } = require('./NotaCondicionalService');

function renderizarCertificado(datos, folio, hash) {
    if (!datos || datos.length === 0) {
        return `<html><body><p>No hay datos para generar el certificado.</p></body></html>`;
    }
    const asambleista = datos[0];
    
    // Agrupar propuestas (evitar duplicados por la vista)
    const propuestasVistas = {};
    datos.forEach(row => {
        if (row.id_propuesta && !propuestasVistas[row.id_propuesta]) {
            propuestasVistas[row.id_propuesta] = {
                titulo: row.titulo,
                codigo_air: row.codigo_air,
                origen: row.origen,
                sesion_fecha: row.sesion_fecha
            };
        }
    });
    const propuestas = Object.values(propuestasVistas);
    
    // Aplicar reglas condicionales a cada propuesta
    const propuestasConNota = propuestas.map(p => aplicarReglasCondicionales(p));
    
    const totalAsistencias = asambleista.total_asistencias_plenarias || 0;
    
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Certificación AIR</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 2cm; }
        h1 { font-size: 18pt; text-align: center; }
        .header { text-align: center; margin-bottom: 30px; }
        .folio { text-align: right; font-size: 10pt; margin-bottom: 20px; }
        .content { line-height: 1.5; }
        .propuesta { margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px; }
        .nota { font-style: italic; color: #555; font-size: 9pt; margin-top: 5px; }
        .footer { margin-top: 40px; font-size: 9pt; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
    </style>
    </head>
    <body>
        <div class="folio">Folio: ${folio}</div>
        <div class="header">
            <h1>DIRECTORIO DE LA ASAMBLEA INSTITUCIONAL REPRESENTATIVA</h1>
            <h2>CONSTANCIA</h2>
        </div>
        <div class="content">
            <p>El Ingeniero <strong>Presidente del Directorio</strong> de la Asamblea Institucional Representativa, hace constar que:</p>
            <p><strong>${asambleista.nombre}</strong>, cédula de identidad <strong>${asambleista.cedula}</strong>,</p>
            <p>Según consta en los registros de la Secretaría de la AIR, ${asambleista.sector_nombre ? 'representa al sector ' + asambleista.sector_nombre : ''} desde ${asambleista.nombramiento_inicio} ${asambleista.nombramiento_fin ? 'hasta ' + asambleista.nombramiento_fin : ''}.</p>
            <p>Se reporta su participación en <strong>${totalAsistencias}</strong> sesiones plenarias convocadas en el periodo.</p>
            <p>Participó activamente en el trabajo de las siguientes propuestas y comisiones:</p>
            ${propuestasConNota.map(p => `
                <div class="propuesta">
                    <strong>${p.titulo || 'Propuesta sin título'}</strong> ${p.codigo_air ? '(' + p.codigo_air + ')' : ''}
                    ${p.sesion_fecha ? `<br/>Sesión: ${new Date(p.sesion_fecha).toLocaleDateString()}` : ''}
                    ${p.nota_legal ? `<div class="nota">Nota: ${p.nota_legal}</div>` : ''}
                </div>
            `).join('')}
        </div>
        <div class="footer">
            <p>Declaración jurada según el artículo 301 de la Ley General de la Administración Pública.</p>
            <p>Fecha de emisión: ${new Date().toLocaleDateString()}</p>
            <p>Hash de verificación: ${hash}</p>
        </div>
    </body>
    </html>
    `;
}

module.exports = { renderizarCertificado };