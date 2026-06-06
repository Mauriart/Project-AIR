-- Issue #14: Historial de nombramientos

DROP TRIGGER IF EXISTS tg_traslape_sector ON nombramiento;

CREATE OR REPLACE FUNCTION fn_validar_traslape_nombramiento()
RETURNS TRIGGER AS $$
DECLARE
    conflicto INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflicto
    FROM nombramiento
    WHERE asambleista_id = NEW.asambleista_id
      AND estado = 'ACTIVO'
      AND (fecha_inicio <= COALESCE(NEW.fecha_fin, '9999-12-31'))
      AND (COALESCE(NEW.fecha_fin, '9999-12-31') >= fecha_inicio)
      AND nombramiento_id != COALESCE(NEW.nombramiento_id, 0);

    IF conflicto > 0 THEN
        RAISE EXCEPTION 'Error: El asambleísta ya tiene un nombramiento activo que traslapa las fechas ingresadas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_traslape_sector
BEFORE INSERT OR UPDATE ON nombramiento
FOR EACH ROW
EXECUTE FUNCTION fn_validar_traslape_nombramiento();

CREATE INDEX IF NOT EXISTS idx_nombramiento_asambleista ON nombramiento(asambleista_id, estado);