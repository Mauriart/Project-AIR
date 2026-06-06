-- Reportes administrativos para certificaciones y folios.
CREATE OR REPLACE VIEW vw_reporte_certificaciones_mes AS
SELECT
    EXTRACT(YEAR FROM fecha_emision)::INT AS anio,
    EXTRACT(MONTH FROM fecha_emision)::INT AS mes,
    TO_CHAR(fecha_emision, 'YYYY-MM') AS periodo,
    COUNT(*)::INT AS total_certificaciones
FROM certificacion_emitida
GROUP BY
    EXTRACT(YEAR FROM fecha_emision),
    EXTRACT(MONTH FROM fecha_emision),
    TO_CHAR(fecha_emision, 'YYYY-MM');

-- Conteo de certificaciones por sector segun el nombramiento vigente al emitir.
CREATE OR REPLACE VIEW vw_reporte_certificaciones_sector AS
SELECT
    COALESCE(cs.nombre, 'Sin sector') AS sector,
    COUNT(c.id_certificacion)::INT AS total_certificaciones
FROM certificacion_emitida c
JOIN asambleista a
    ON c.id_asambleista = a.asambleista_id
LEFT JOIN nombramiento n
    ON n.asambleista_id = a.asambleista_id
    AND c.fecha_emision::DATE >= n.fecha_inicio
    AND c.fecha_emision::DATE <= COALESCE(n.fecha_fin, DATE '9999-12-31')
LEFT JOIN catalogo_sector cs
    ON n.sector_id = cs.id_sector
GROUP BY COALESCE(cs.nombre, 'Sin sector');

-- Conteo de folios emitidos por anio.
CREATE OR REPLACE VIEW vw_reporte_folios_anio AS
SELECT
    EXTRACT(YEAR FROM fecha_emision)::INT AS anio,
    COUNT(folio_unico)::INT AS total_folios
FROM certificacion_emitida
GROUP BY EXTRACT(YEAR FROM fecha_emision);
