DROP TABLE IF EXISTS nombramiento CASCADE; 
DROP TABLE IF EXISTS asambleista CASCADE;

CREATE TABLE asambleista (
    asambleista_id SERIAL PRIMARY KEY,  -- Identificador único para cada asambleísta
    cedula VARCHAR(12) NOT NULL UNIQUE,  -- Cédula de identidad del asambleísta, debe ser única
    nombre VARCHAR(150) NOT NULL,  -- Nombre completo del asambleísta
    correo_institucional VARCHAR(150) NOT NULL UNIQUE -- Correo institucional del asambleísta, debe ser único
);

CREATE TABLE nombramiento (
    nombramiento_id SERIAL PRIMARY KEY, -- Identificador único para cada nombramiento

    asambleista_id INTEGER NOT NULL, -- Referencia al asambleísta que recibe el nombramiento

    fecha_inicio DATE NOT NULL, -- Fecha de inicio del nombramiento
    fecha_fin DATE, -- Fecha de fin del nombramiento

    estado VARCHAR(20) NOT NULL
    CHECK (
        estado IN (
            'ACTIVO',
            'FINALIZADO',
            'SUSPENDIDO'
    )
),

    CONSTRAINT fk_nombramiento_asambleista -- Clave foránea que referencia a la tabla asambleista
        FOREIGN KEY (asambleista_id)
        REFERENCES asambleista(asambleista_id)
);

CREATE OR REPLACE FUNCTION validar_traslape_nombramientos() -- Función para validar que no haya traslape de nombramientos para un mismo asambleísta
RETURNS TRIGGER AS
$$
BEGIN

    IF EXISTS (
        SELECT 1
        FROM nombramiento
        WHERE asambleista_id = NEW.asambleista_id
        AND (
            NEW.fecha_inicio <= COALESCE(fecha_fin, '9999-12-31')
            AND
            COALESCE(NEW.fecha_fin, '9999-12-31') >= fecha_inicio
        )
    ) THEN

        RAISE EXCEPTION
        'El asambleista ya tiene un nombramiento en ese rango de fechas';

    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_traslape
BEFORE INSERT ON nombramiento
FOR EACH ROW
EXECUTE FUNCTION validar_traslape_nombramientos();

INSERT INTO asambleista (
    cedula,
    nombre,
    correo_institucional
)
VALUES (
    '1-1234-5678',
    'Juan Morales',
    'juan.morales@itcr.ac.cr'
);

INSERT INTO nombramiento (
    asambleista_id,
    fecha_inicio,
    estado
)
VALUES (
    1,
    '2026-01-01',
    'ACTIVO'
);