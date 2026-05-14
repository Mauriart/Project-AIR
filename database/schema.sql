-- Este archivo es el esquema de la base de datos
-- Los scripts por sprint se encuentran en la carpeta database/sprint#

-- Tabla de Catalogos
-- Catalogos a los que se hace referencia en la base de datos
CREATE TABLE catalogo_sector (
  id_sector SERIAL PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE catalogo_puestos (
  id_puesto SERIAL PRIMARY KEY,
  nombre_puesto  VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE catalogo_nivel_reglamento (
  id_nivel_reglamento  SERIAL PRIMARY KEY,
  nombre VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE catalogo_estado_vigencia (
  id_estado_vigencia  SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Datos semilla básicos
INSERT INTO catalogo_sector (nombre) VALUES
  ('Docente'), ('Estudiante'), ('Administrativo'),
  ('Egresado'), ('Funcionario');

INSERT INTO catalogo_estado_vigencia (nombre) VALUES
  ('Vigente'), ('Histórico'), ('Derogado');

INSERT INTO catalogo_nivel_reglamento (nombre) VALUES
  ('Título'), ('Capítulo'), ('Artículo'),
  ('Inciso'), ('Sub-inciso');

    INSERT INTO catalogo_puestos (nombre_puesto) VALUES
  ('Presidente'),
  ('Vicepresidente'),
  ('Secretario'),
  ('Vocal');

-- Tablas de Seguridad
-- MÓDULO: Seguridad y Roles (Issue #0) 
-- Sprint 2
create table sys_usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    email VARCHAR(150) UNIQUE NOT NULL, 
    activo BOOLEAN DEFAULT TRUE 
);

create table sys_rol (
  id_rol serial PRIMARY KEY,
  nombre_rol  varchar(50) unique not null
);

create table sys_permiso(
    id_permiso serial PRIMARY KEY,
    nombre_permiso varchar(50) unique not null,
    description varchar(200) not null
);

create table sys_usuario_rol(
    id_usuario INT,
    id_rol INT,
    PRIMARY KEY (id_usuario, id_rol),
    Constraint fk_usuario
        FOREIGN KEY (id_usuario) REFERENCES sys_usuario(id_usuario),
    Constraint fk_rol
        FOREIGN KEY (id_rol) REFERENCES sys_rol(id_rol)
);

create table sys_rol_permiso(
    id_rol INT,
    id_permiso INT,
    PRIMARY KEY (id_rol, id_permiso),
    Constraint fk_rol_permiso
        FOREIGN KEY (id_rol) REFERENCES sys_rol(id_rol),
    Constraint fk_permiso
        FOREIGN KEY (id_permiso) REFERENCES sys_permiso(id_permiso)
);

create table sys_log_auditoria(
    id_log SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    detalle VARCHAR(200) NOT NULL,
    ip_origen VARCHAR(45) NOT NULL,
    registro_id INT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Constraint fk_log_usuario
        FOREIGN KEY (id_usuario) REFERENCES sys_usuario(id_usuario)
);

-- elementos del sprint 2 (03_asambleistas.sql)
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