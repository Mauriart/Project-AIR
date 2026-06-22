const { obtenerDatosCertificacion, emitirCertificacion } = require('./src/models/CertificacionModel');
const { renderizarCertificado } = require('./src/services/TemplateService');
const { generarPDF } = require('./src/services/PDFService');
const { generarHash } = require('./src/services/CryptoService');
const pool = require('./src/config/db');

async function test() {
    try {
        // Cambia este ID por un asambleísta que tenga datos en tu BD
        const asambleistaId = 1;
        console.log(`🔍 Buscando datos del asambleísta ${asambleistaId}...`);
        
        const datos = await obtenerDatosCertificacion(asambleistaId);
        if (!datos || datos.length === 0) {
            console.log('❌ No hay datos para el asambleísta', asambleistaId);
            console.log('💡 Verifica que tenga nombramiento, propuestas o asistencias.');
            return;
        }
        console.log(`✅ Datos encontrados: ${datos.length} registros`);

        // Generar HTML temporal para calcular el hash (sin folio aún)
        let htmlTemp = renderizarCertificado(datos, '{{FOLIO}}', '{{HASH}}');
        const hash = generarHash(htmlTemp);
        console.log(`🔑 Hash generado: ${hash.substring(0, 10)}...`);

        // Emitir certificación (esto guarda en BD y genera folio automático)
        const certificado = await emitirCertificacion(asambleistaId, 'test_user', hash);
        const folio = certificado.folio_unico;
        console.log(`📄 Folio asignado: ${folio}`);

        // Generar HTML final con folio real y hash
        const htmlFinal = renderizarCertificado(datos, folio, hash);
        
        // Generar PDF
        const pdfBuffer = await generarPDF(htmlFinal);
        const filename = `certificado_${folio}.pdf`;
        require('fs').writeFileSync(filename, pdfBuffer);
        console.log(`✅ PDF generado exitosamente: ${filename}`);
        console.log(`📂 Ubicación: ${__dirname}/${filename}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        pool.end();
    }
}

test();