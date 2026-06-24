const PDFDocument = require('pdfkit');

function generarPDF(contenido, folio) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            // ========== CONTENIDO DEL CERTIFICADO ==========
            doc.fontSize(14).font('Helvetica-Bold').text('DIRECTORIO DE LA ASAMBLEA INSTITUCIONAL REPRESENTATIVA', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).font('Helvetica-Bold').text('CONSTANCIA', { align: 'center' });
            doc.moveDown();

            doc.fontSize(11).font('Helvetica');

            const asambleista = contenido.asambleista;
            const propuestas = contenido.propuestas || [];

            doc.text(`El Ingeniero Presidente del Directorio de la Asamblea Institucional Representativa, hace constar que:`, { align: 'justify' });
            doc.moveDown();
            doc.text(`${asambleista.nombre}, cédula de identidad ${asambleista.cedula},`, { align: 'justify' });
            doc.moveDown();

            const sectorTexto = asambleista.sector_nombre ? `representa al sector ${asambleista.sector_nombre}` : '';
            const periodoTexto = asambleista.nombramiento_inicio ? 
                `desde ${new Date(asambleista.nombramiento_inicio).toLocaleDateString()} ${asambleista.nombramiento_fin ? 'hasta ' + new Date(asambleista.nombramiento_fin).toLocaleDateString() : ''}` : '';
            doc.text(`Según consta en los registros de la Secretaría de la AIR, ${sectorTexto} ${periodoTexto}.`, { align: 'justify' });
            doc.moveDown();

            const totalAsistencias = asambleista.total_asistencias_plenarias || 0;
            doc.text(`Se reporta su participación en ${totalAsistencias} sesiones plenarias convocadas en el periodo.`, { align: 'justify' });
            doc.moveDown();

            doc.text('Participó activamente en el trabajo de las siguientes propuestas y comisiones:');
            doc.moveDown();

            if (propuestas && propuestas.length > 0) {
                propuestas.forEach((p, idx) => {
                    doc.text(`${idx+1}. ${p.titulo || 'Propuesta sin título'} ${p.codigo_air ? '(' + p.codigo_air + ')' : ''}`);
                    if (p.sesion_fecha) {
                        doc.text(`   Sesión: ${new Date(p.sesion_fecha).toLocaleDateString()}`);
                    }
                    if (p.nota_legal) {
                        doc.fontSize(9).fillColor('#555').text(`   Nota: ${p.nota_legal}`, { indent: 10 });
                        doc.fontSize(11).fillColor('#000');
                    }
                    doc.moveDown(0.5);
                });
            } else {
                doc.text('No se encontraron propuestas o comisiones registradas.');
            }

            doc.moveDown();
            doc.fontSize(9).font('Helvetica-Oblique').text('Declaración jurada según el artículo 301 de la Ley General de la Administración Pública.', { align: 'center' });
            doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.text(`Hash de verificación: ${asambleista.hash || 'hash_preview'}`, { align: 'center' });
            doc.font('Helvetica-Bold').text(`Folio: ${folio || 'PREVIEW'}`, { align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generarPDF };