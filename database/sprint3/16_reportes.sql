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

-- Crea vistas compatibles con el esquema vigente o con bases locales previas.
DO $$
DECLARE
    tiene_id_asambleista BOOLEAN;
    tiene_folio_unico BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'certificacion_emitida'
          AND column_name = 'id_asambleista'
    ) INTO tiene_id_asambleista;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'certificacion_emitida'
          AND column_name = 'folio_unico'
    ) INTO tiene_folio_unico;

    IF tiene_id_asambleista THEN
        EXECUTE $view$
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
            GROUP BY COALESCE(cs.nombre, 'Sin sector')
        $view$;
    ELSE
        EXECUTE $view$
            CREATE OR REPLACE VIEW vw_reporte_certificaciones_sector AS
            SELECT
                COALESCE(cs.nombre, 'Sin sector') AS sector,
                COUNT(c.id_certificacion)::INT AS total_certificaciones
            FROM certificacion_emitida c
            LEFT JOIN asambleista a
                ON LOWER(a.nombre) = LOWER(c.nombre_solicitante)
            LEFT JOIN nombramiento n
                ON n.asambleista_id = a.asambleista_id
                AND c.fecha_emision::DATE >= n.fecha_inicio
                AND c.fecha_emision::DATE <= COALESCE(n.fecha_fin, DATE '9999-12-31')
            LEFT JOIN catalogo_sector cs
                ON n.sector_id = cs.id_sector
            GROUP BY COALESCE(cs.nombre, 'Sin sector')
        $view$;
    END IF;

    IF tiene_folio_unico THEN
        EXECUTE $view$
            CREATE OR REPLACE VIEW vw_reporte_folios_anio AS
            SELECT
                EXTRACT(YEAR FROM fecha_emision)::INT AS anio,
                COUNT(folio_unico)::INT AS total_folios
            FROM certificacion_emitida
            GROUP BY EXTRACT(YEAR FROM fecha_emision)
        $view$;
    ELSE
        EXECUTE $view$
            CREATE OR REPLACE VIEW vw_reporte_folios_anio AS
            SELECT
                EXTRACT(YEAR FROM fecha_emision)::INT AS anio,
                COUNT(folio)::INT AS total_folios
            FROM certificacion_emitida
            GROUP BY EXTRACT(YEAR FROM fecha_emision)
        $view$;
    END IF;
END $$;
