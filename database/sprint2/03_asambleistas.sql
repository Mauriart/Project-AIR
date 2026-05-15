DROP TABLE IF EXISTS bitacora_asambleistas CASCADE; --El cascade asegura que "borre también dependencias relacionadas"
DROP TABLE IF EXISTS nombramiento CASCADE;
DROP TABLE IF EXISTS resolucion CASCADE;
DROP TABLE IF EXISTS asambleista CASCADE;

CREATE TABLE asambleista (
    asambleista_id SERIAL PRIMARY KEY, -- Identificador único para cada asambleísta

    cedula VARCHAR(12) NOT NULL UNIQUE -- Asumimos que la cédula es un número de 8 a 12 dígitos, pero se almacena como texto para preservar ceros a la izquierda y evitar problemas de formato
    CHECK (
        cedula ~ '^[0-9]{8,12}$'
    ),

    nombre VARCHAR(150) NOT NULL, -- Se asume que el nombre completo no excederá los 150 caracteres, pero esto puede ajustarse según las necesidades

    correo_institucional VARCHAR(150) NOT NULL UNIQUE -- Se asume que el correo institucional sigue un formato estándar y no excederá los 150 caracteres, pero esto también puede ajustarse según las necesidades
);

CREATE TABLE resolucion (
    resolucion_id SERIAL PRIMARY KEY,

    numero_resolucion VARCHAR(50) NOT NULL UNIQUE,

    descripcion TEXT,

    fecha_resolucion DATE NOT NULL
);

CREATE TABLE nombramiento (
    nombramiento_id SERIAL PRIMARY KEY,

    asambleista_id INTEGER NOT NULL,

    sector_id INTEGER NOT NULL,

    id_puesto INTEGER NOT NULL,

    resolucion_id INTEGER NOT NULL,  --Dudas sobre si esto es necesario, pero lo agrego para tener un registro de la resolución que respalda el nombramiento, dudas ademas sobre si dejarlo como obligatorio o no, pero lo dejo obligatorio para asegurar la trazabilidad de cada nombramiento

    fecha_inicio DATE NOT NULL,

    fecha_fin DATE,

    estado VARCHAR(20) NOT NULL
    CHECK (
        estado IN (
            'ACTIVO',
            'FINALIZADO',
            'SUSPENDIDO'
        )
    ),

    CONSTRAINT fk_nombramiento_asambleista
        FOREIGN KEY (asambleista_id)
        REFERENCES asambleista(asambleista_id),

    CONSTRAINT fk_nombramiento_sector
        FOREIGN KEY (sector_id)
        REFERENCES catalogo_sector(id_sector),

    CONSTRAINT fk_nombramiento_puesto
        FOREIGN KEY (id_puesto)
        REFERENCES catalogo_puestos(id_puesto),

    CONSTRAINT fk_nombramiento_resolucion
        FOREIGN KEY (resolucion_id)
        REFERENCES resolucion(resolucion_id)
);

CREATE TABLE bitacora_asambleistas (
    bitacora_id SERIAL PRIMARY KEY,

    asambleista_id INTEGER NOT NULL,

    cedula_anterior VARCHAR(12),
    cedula_nueva VARCHAR(12),

    nombre_anterior VARCHAR(150),
    nombre_nuevo VARCHAR(150),

    razon_cambio TEXT NOT NULL,

    fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bitacora_asambleista
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

CREATE OR REPLACE FUNCTION registrar_cambio_asambleista()
RETURNS TRIGGER AS
$$
BEGIN

    IF OLD.nombre IS DISTINCT FROM NEW.nombre
    OR OLD.cedula IS DISTINCT FROM NEW.cedula THEN

        INSERT INTO bitacora_asambleistas (
            asambleista_id,

            cedula_anterior,
            cedula_nueva,

            nombre_anterior,
            nombre_nuevo,

            razon_cambio
        )
        VALUES (
            OLD.asambleista_id,

            OLD.cedula,
            NEW.cedula,

            OLD.nombre,
            NEW.nombre,

            'Actualizacion de identidad'
        );

    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_traslape
BEFORE INSERT ON nombramiento
FOR EACH ROW
EXECUTE FUNCTION validar_traslape_nombramientos();

CREATE TRIGGER trigger_bitacora_asambleistas
BEFORE UPDATE ON asambleista
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_asambleista();

-- Datos de prueba para asambleísta y nombramiento
INSERT INTO asambleista (
    cedula,
    nombre,
    correo_institucional
)
VALUES (
    '20890785',
    'Juan Morales',
    'juan.morales@itcr.ac.cr'
);

INSERT INTO asambleista (
    cedula,
    nombre,
    correo_institucional
)
VALUES (
    '30456012',
    'María López',
    'maria.lopez@itcr.ac.cr'
);

INSERT INTO resolucion (
    numero_resolucion,
    descripcion,
    fecha_resolucion
)
VALUES (
    'RES-2025-001',
    'Nombramiento oficial',
    '2025-01-01'
);

INSERT INTO nombramiento (
    asambleista_id,
    sector_id,
    resolucion_id,
    id_puesto,
    fecha_inicio,
    fecha_fin,
    estado
)
VALUES (
    1,
    1,
    1,
    1,
    '2025-01-01',
    NULL,
    'ACTIVO'
);

CREATE OR REPLACE VIEW vw_asambleistas_nombramientos AS
SELECT
    a.asambleista_id,
    a.nombre,
    a.cedula,
    a.correo_institucional,

    n.nombramiento_id,
    n.fecha_inicio,
    n.fecha_fin,
    n.estado,

    CASE
        WHEN n.fecha_fin IS NULL THEN 'VIGENTE'
        ELSE 'INACTIVO'
    END AS vigencia

FROM asambleista a
JOIN nombramiento n
    ON a.asambleista_id = n.asambleista_id;

CREATE INDEX idx_asambleista_cedula
ON asambleista(cedula);

CREATE INDEX idx_nombramiento_estado
ON nombramiento(estado);

SELECT *  -- Ejemplo de consulta a la vista para verificar su funcionamiento
FROM vw_asambleistas_nombramientos
WHERE nombre ILIKE '%juan%'
OR cedula ILIKE '%2089%';