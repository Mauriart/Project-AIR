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

-- Catologos adicionales necesarios (issue #10)
CREATE TABLE catalogo_tipo_sesion(
  id_tipo_sesion SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE catalogo_tipo_modalidad(
  id_tipo_modalidad SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE catalogo_etapas_propuestas(
  id_etapa_propuesta SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE catalogo_estado_propuesta(
  id_estado_propuesta SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE catalogo_tipo_mayoria_requerida(
  id_tipo_mayoria_requerida SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

--Datos semilla (issue #10)
INSERT INTO catalogo_tipo_sesion (nombre) VALUES
  ('Ordinaria'), ('Extraordinaria');

INSERT INTO catalogo_tipo_modalidad (nombre) VALUES
  ('Presencial'), ('Virtual'), ('Hibrida');

INSERT INTO catalogo_etapas_propuestas (nombre) VALUES
  ('Procedencia'), ('Aprobacion');

INSERT INTO catalogo_estado_propuesta (nombre) VALUES
  ('Pendiente de revision'), ('En discucion'), ('Aprobada'), ('Rechazada');

INSERT INTO catalogo_tipo_mayoria_requerida (nombre) VALUES
  ('Simple'), ('Calificada');

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

-- Issue #10
-- Seccion 1: Tablas de Normativa
create table reglamento(
    id_reglamento serial primary key,
    nombre_normativa varchar(200) not null,
    sigla varchar(10) unique not null
);
-- tabla recursiva elemento_normativo
create table elemento_normativo(
    id_elemento serial primary key,
    id_reglamento int not null,
    id_elemento_padre int,
    id_nivel_reglamento int not null,
    numero_etiqueta varchar(10) not null,
    contenido_texto text,
    orden int not null,
    fecha_inicio_vigencia date not null default current_date,
    fecha_fin_vigencia date,
    id_estado_vigencia int not null,
    constraint fk_elemento_reglamento
        foreign key (id_reglamento)
        references reglamento(id_reglamento),
    constraint fk_elemento_padre
        foreign key (id_elemento_padre)
        references elemento_normativo(id_elemento),
    constraint fk_nivel_reglamento
        foreign key (id_nivel_reglamento)
        references catalogo_nivel_reglamento(id_nivel_reglamento)
        on delete restrict,
    constraint fk_estado_vigencia
        foreign key (id_estado_vigencia)
        references catalogo_estado_vigencia(id_estado_vigencia)
        on delete restrict
);

-- Partial Unique Index
create unique index idx_unicidad_vigente
    on elemento_normativo(id_elemento_padre, numero_etiqueta, id_reglamento)
    where fecha_fin_vigencia is null;

-- trigeer 
-- Cuando se inserta un elemento nuevo,
-- busca si existe una versión anterior activa
-- del mismo elemento bajo el mismo padre
create or replace function fn_vigencia_normativa()
returns trigger as $$
begin
    update elemento_normativo
    set
        fecha_fin_vigencia = current_date,
        id_estado_vigencia = (
            select id_estado_vigencia
            from catalogo_estado_vigencia
            where nombre in ('Histórico', 'Historico')
            limit 1
        )
    where 
        id_reglamento = new.id_reglamento
        and id_elemento_padre is not distinct from new.id_elemento_padre
        and numero_etiqueta = new.numero_etiqueta
        and fecha_fin_vigencia is null;
    return new;
end;
$$ language plpgsql;

create trigger tg_vigencia_normativa
before insert on elemento_normativo
for each row
execute function fn_vigencia_normativa();

-- Seccion 2: Sesiomes y Propuestas
create table sesiones(
  id_sesion SERIAL PRIMARY KEY,
  id_tipo_modalidad INT NOT NULL,
  id_tipo_sesion INT NOT NULL,
  numero_sesion VARCHAR(20) NOT NULL,
  fecha date NOT NULL,
  link_acta VARCHAR(200),
  quorum int not null,

  constraint uq_sesion_numero
    unique (numero_sesion),

  constraint fk_sesion_modalidad
    foreign key (id_tipo_modalidad)
    references catalogo_tipo_modalidad(id_tipo_modalidad),

  constraint fk_sesion_tipo
    foreign key (id_tipo_sesion)
    references catalogo_tipo_sesion(id_tipo_sesion)
);

-- tabla recursiva id_propuesta_padre
create table propuesta(
  id_propuesta SERIAL PRIMARY KEY,
  id_reglamento_base int,
  id_etapa_propuesta int not null,
  id_estado_propuesta int not null,
  id_propuesta_padre int,
  titulo varchar(200) not null,
  texto_sustitutivo text,
  codigo_air varchar(50),
  id_tipo_mayoria_requerida int not null,

  constraint fk_propuesta_reglamento
    foreign key (id_reglamento_base)
    references reglamento(id_reglamento),

  constraint fk_propuesta_etapa
    foreign key (id_etapa_propuesta)
    references catalogo_etapas_propuestas(id_etapa_propuesta),

  constraint fk_propuesta_estado
    foreign key (id_estado_propuesta)
    references catalogo_estado_propuesta(id_estado_propuesta),

  constraint fk_propuesta_padre
    foreign key (id_propuesta_padre)
    references propuesta(id_propuesta),

  constraint fk_propuesta_mayoria
    foreign key (id_tipo_mayoria_requerida)
    references catalogo_tipo_mayoria_requerida(id_tipo_mayoria_requerida)
);

create table punto_agenda(
  id_punto_agenda SERIAL PRIMARY KEY,
  id_sesion int not null,
  id_propuesta int not null,
  orden int not null,
  descripcion text,

  constraint fk_agenda_sesion
    foreign key (id_sesion)
    references sesiones(id_sesion),

  constraint fk_agenda_propuesta
    foreign key (id_propuesta)
    references propuesta(id_propuesta),

  constraint uq_agenda_sesion_propuesta
    unique (id_sesion, id_propuesta),

  constraint uq_agenda_sesion_orden
    unique (id_sesion, orden)
);

create table resolucion_propuesta(
  id_resolucion_propuesta SERIAL PRIMARY KEY,
  id_punto_agenda int not null,
  numero_resolucion varchar(20) not null,
  fecha_emision date not null,

  constraint fk_resolucion_agenda
    foreign key (id_punto_agenda)
    references punto_agenda(id_punto_agenda),

  constraint uq_resolucion_punto_agenda
    unique (id_punto_agenda),

  constraint uq_resolucion_numero
    unique (numero_resolucion)
);

-- elementos del sprint 2 (03_asambleistas.sql)

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
        REFERENCES asambleista(asambleista_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_nombramiento_sector
        FOREIGN KEY (sector_id)
        REFERENCES catalogo_sector(id_sector)
        ON DELETE RESTRICT,

    CONSTRAINT fk_nombramiento_puesto
        FOREIGN KEY (id_puesto)
        REFERENCES catalogo_puestos(id_puesto),

    CONSTRAINT fk_nombramiento_resolucion
        FOREIGN KEY (resolucion_id)
        REFERENCES resolucion(resolucion_id),

    CONSTRAINT chk_fechas_nombramiento
    CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
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

-- Folio de certificado
-- "Este módulo gestiona la emisión de certificaciones. 
-- El sistema genera un folio único correlativo por año — en este caso CERT-2026-001. 
-- Este folio es el identificador oficial del documento. 
-- La generación completa del certificado con datos del asambleísta es parte del Sprint 3."
CREATE OR REPLACE FUNCTION fn_preview_siguiente_folio()
RETURNS VARCHAR AS $$
DECLARE
    ultimo_id INT;
    anio INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    SELECT COUNT(*) INTO ultimo_id FROM sys_log_auditoria WHERE accion = 'CERTIFICACION';
    RETURN 'CERT-' || anio || '-' || LPAD((ultimo_id + 1)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
-- *****************
-- **Datos semilla**
-- *****************

INSERT INTO sys_rol (nombre_rol) VALUES
  ('Administrador'),
  ('Secretaría'),
  ('Asambleísta');

INSERT INTO sys_permiso (nombre_permiso, description) VALUES
  ('EMITIR_CERTIFICACION', 'Permite emitir certificaciones legales'),
  ('GESTIONAR_ASAMBLEISTAS', 'Permite registrar y editar asambleístas'),
  ('GESTIONAR_PROPUESTAS', 'Permite registrar propuestas y mociones'),
  ('VER_ASAMBLEISTAS', 'Permite consultar datos de asambleístas'),
  ('VER_REGLAMENTOS', 'Permite consultar el compilador normativo');

-- Asignar permisos por rol
-- Administrador tiene todos los permisos
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
  'EMITIR_CERTIFICACION',
  'GESTIONAR_ASAMBLEISTAS',
  'GESTIONAR_PROPUESTAS',
  'VER_ASAMBLEISTAS',
  'VER_REGLAMENTOS'
)
WHERE r.nombre_rol = 'Administrador';

-- Secretaría puede gestionar y ver
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
  'GESTIONAR_ASAMBLEISTAS',
  'GESTIONAR_PROPUESTAS',
  'VER_ASAMBLEISTAS',
  'VER_REGLAMENTOS'
)
WHERE r.nombre_rol = 'Secretaría';

-- Asambleísta solo puede ver
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
  'VER_ASAMBLEISTAS',
  'VER_REGLAMENTOS'
)
WHERE r.nombre_rol = 'Asambleísta';

-- Usuarios semilla para desarrollo
-- Passwords:
--   admin_air      / Admin123!
--   secretaria_air / Secretaria123!
--   asambleista_air / Asambleista123!
INSERT INTO sys_usuario (username, password_hash, email, activo) VALUES
  ('admin_air', '$2a$10$U/8IDGSXk/PqQ1gDyU1l9.yxRUMe9kUHzpanv9QdxBC6QakBfTjOu', 'admin.air@itcr.ac.cr', TRUE),
  ('secretaria_air', '$2a$10$PzyKXDI5Z0IqspKN5U3w8O1380Dq6/G6yIbpR7Sh/dQ97IZMkU3u2', 'secretaria.air@itcr.ac.cr', TRUE),
  ('asambleista_air', '$2a$10$02VtH2YsSzjN7ENNM57B1eS9TwfKT//7/m3ys63saFcbCmLUmRBGu', 'asambleista.air@itcr.ac.cr', TRUE);

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM sys_usuario u
JOIN sys_rol r ON r.nombre_rol = 'Administrador'
WHERE u.username = 'admin_air';

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM sys_usuario u
JOIN sys_rol r ON r.nombre_rol = 'Secretaría'
WHERE u.username = 'secretaria_air';

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM sys_usuario u
JOIN sys_rol r ON r.nombre_rol = 'Asambleísta'
WHERE u.username = 'asambleista_air';


-- ============================
-- SPRINT 3: Issue #11 — Quórum 
-- ============================
-- =========================================
-- SPRINT 3: Issue #11 — Quórum y Asistencia
-- =========================================

CREATE TABLE catalogo_estado_asistencia (
    id_estado_asistencia SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO catalogo_estado_asistencia (nombre) VALUES
    ('Presente'),
    ('Ausente'),
    ('Justificado');

CREATE TABLE asistencia_sesion_plenaria (
    id_asistencia        SERIAL PRIMARY KEY,
    id_asambleista       INT NOT NULL,
    id_sesion            INT NOT NULL,
    id_estado_asistencia INT NOT NULL,
    fecha_registro       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Un asambleísta solo puede tener un registro por sesión
    CONSTRAINT uq_asistencia_sesion
        UNIQUE (id_asambleista, id_sesion),

    CONSTRAINT fk_asistencia_asambleista
        FOREIGN KEY (id_asambleista)
        REFERENCES asambleista(asambleista_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_asistencia_sesion
        FOREIGN KEY (id_sesion)
        REFERENCES sesiones(id_sesion)
        ON DELETE RESTRICT,

    CONSTRAINT fk_asistencia_estado
        FOREIGN KEY (id_estado_asistencia)
        REFERENCES catalogo_estado_asistencia(id_estado_asistencia)
        ON DELETE RESTRICT
);

-- Función que valida si una sesión tiene quórum legal
-- Retorna TRUE si los presentes >= quorum requerido de la sesión
CREATE OR REPLACE FUNCTION validar_quorum_legal(p_id_sesion INT)
RETURNS BOOLEAN AS $$
DECLARE
    total_presentes INT;
    quorum_requerido INT;
BEGIN
    -- Contar asambleístas con estado Presente en esa sesión
    SELECT COUNT(*) INTO total_presentes
    FROM asistencia_sesion_plenaria asp
    JOIN catalogo_estado_asistencia cea 
        ON asp.id_estado_asistencia = cea.id_estado_asistencia
    WHERE asp.id_sesion = p_id_sesion
      AND cea.nombre = 'Presente';

    -- Obtener el quórum requerido de la sesión
    SELECT quorum INTO quorum_requerido
    FROM sesiones
    WHERE id_sesion = p_id_sesion;

    RETURN total_presentes >= quorum_requerido;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- SPRINT 3: Issue #5 — Foliado y Certificaciones
-- =========================================

-- Lleva el control del último número de folio por año
CREATE TABLE control_folio (
    id_control          SERIAL PRIMARY KEY,
    anio                INT NOT NULL,
    prefijo             VARCHAR(10) NOT NULL DEFAULT 'DAIR',
    ultimo_numero       INT NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Solo puede existir un registro por año y prefijo
    CONSTRAINT uq_folio_anio_prefijo
        UNIQUE (anio, prefijo)
);

-- Registro inmutable de certificaciones emitidas
CREATE TABLE certificacion_emitida (
    id_certificacion    SERIAL PRIMARY KEY,
    id_asambleista      INT NOT NULL,
    folio_unico         VARCHAR(20) NOT NULL UNIQUE,
    hash_seguridad      VARCHAR(64),
    fecha_emision       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_secretaria  VARCHAR(80) NOT NULL,

    CONSTRAINT fk_cert_asambleista
        FOREIGN KEY (id_asambleista)
        REFERENCES asambleista(asambleista_id)
        ON DELETE RESTRICT
);

-- Trigger que bloquea modificar o borrar certificaciones ya emitidas
-- Garantiza la inmutabilidad legal del documento
CREATE OR REPLACE FUNCTION fn_no_repudio_cert()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'Una certificación emitida no puede modificarse ni eliminarse. Folio: %',
        OLD.folio_unico;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_no_repudio_cert
BEFORE UPDATE OR DELETE ON certificacion_emitida
FOR EACH ROW
EXECUTE FUNCTION fn_no_repudio_cert();

-- Trigger que genera el folio automáticamente al insertar
-- Hace LOCK para evitar duplicados en concurrencia
CREATE OR REPLACE FUNCTION fn_folio_secuencial()
RETURNS TRIGGER AS $$
DECLARE
    v_anio      INT := EXTRACT(YEAR FROM CURRENT_DATE);
    v_numero    INT;
    v_prefijo   VARCHAR(10) := 'DAIR';
BEGIN
    -- LOCK para evitar que dos usuarios obtengan el mismo número
    PERFORM pg_advisory_xact_lock(1);

    -- Insertar el año si no existe, o sumar 1 al último número
    INSERT INTO control_folio (anio, prefijo, ultimo_numero)
    VALUES (v_anio, v_prefijo, 1)
    ON CONFLICT (anio, prefijo)
    DO UPDATE SET
        ultimo_numero       = control_folio.ultimo_numero + 1,
        fecha_actualizacion = CURRENT_TIMESTAMP
    RETURNING ultimo_numero INTO v_numero;

    -- Asignar el folio con formato DAIR-009-2026
    NEW.folio_unico := v_prefijo || '-' || LPAD(v_numero::TEXT, 3, '0') || '-' || v_anio;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_folio_secuencial
BEFORE INSERT ON certificacion_emitida
FOR EACH ROW
EXECUTE FUNCTION fn_folio_secuencial();

-- Dato semilla: registro inicial del año actual
INSERT INTO control_folio (anio, prefijo, ultimo_numero)
VALUES (2026, 'DAIR', 0);

-- =========================================
-- SPRINT 3: Issue #7 — Comisiones
-- =========================================

CREATE TABLE comision (
    id_comision     SERIAL PRIMARY KEY,
    nombre_comision VARCHAR(200) NOT NULL,
    fecha_creacion  DATE NOT NULL DEFAULT CURRENT_DATE,
    activa          BOOLEAN DEFAULT TRUE
);

-- Relación de comisión con las propuestas que analiza
CREATE TABLE proposito_comision (
    id_proposito_comision SERIAL PRIMARY KEY,
    id_comision           INT NOT NULL,
    id_propuesta          INT NOT NULL,
    descripcion           TEXT,

    CONSTRAINT uq_comision_propuesta
        UNIQUE (id_comision, id_propuesta),

    CONSTRAINT fk_proposito_comision
        FOREIGN KEY (id_comision)
        REFERENCES comision(id_comision)
        ON DELETE RESTRICT,

    CONSTRAINT fk_proposito_propuesta
        FOREIGN KEY (id_propuesta)
        REFERENCES propuesta(id_propuesta)
        ON DELETE RESTRICT
);

CREATE TABLE catalogo_rol_comision (
    id_rol_comision SERIAL PRIMARY KEY,
    nombre          VARCHAR(80) UNIQUE NOT NULL
);

INSERT INTO catalogo_rol_comision (nombre) VALUES
    ('Coordinador'),
    ('Miembro'),
    ('Secretario');

CREATE TABLE integrante_comision (
    id_integrante_comision SERIAL PRIMARY KEY,
    id_comision            INT NOT NULL,
    id_asambleista         INT NOT NULL,
    id_rol_comision        INT NOT NULL,
    fecha_ingreso          DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_salida           DATE,
    estado                 VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),

    CONSTRAINT uq_integrante_activo
        UNIQUE (id_comision, id_asambleista),

    CONSTRAINT fk_integrante_comision
        FOREIGN KEY (id_comision)
        REFERENCES comision(id_comision)
        ON DELETE RESTRICT,

    CONSTRAINT fk_integrante_asambleista
        FOREIGN KEY (id_asambleista)
        REFERENCES asambleista(asambleista_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_integrante_rol
        FOREIGN KEY (id_rol_comision)
        REFERENCES catalogo_rol_comision(id_rol_comision)
        ON DELETE RESTRICT,

    CONSTRAINT chk_fechas_integrante
        CHECK (fecha_salida IS NULL OR fecha_salida > fecha_ingreso)
);

CREATE TABLE sesion_comision (
    id_sesion_comision SERIAL PRIMARY KEY,
    id_comision        INT NOT NULL,
    fecha_hora         TIMESTAMP NOT NULL,
    descripcion        TEXT,

    CONSTRAINT fk_sesion_comision
        FOREIGN KEY (id_comision)
        REFERENCES comision(id_comision)
        ON DELETE RESTRICT
);

CREATE TABLE asistencia_sesion_comision (
    id_asistencia_comision SERIAL PRIMARY KEY,
    id_sesion_comision     INT NOT NULL,
    id_asambleista         INT NOT NULL,
    id_estado_asistencia   INT NOT NULL,

    CONSTRAINT uq_asistencia_comision
        UNIQUE (id_sesion_comision, id_asambleista),

    CONSTRAINT fk_asist_sesion_comision
        FOREIGN KEY (id_sesion_comision)
        REFERENCES sesion_comision(id_sesion_comision)
        ON DELETE RESTRICT,

    CONSTRAINT fk_asist_asambleista_comision
        FOREIGN KEY (id_asambleista)
        REFERENCES asambleista(asambleista_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_asist_estado_comision
        FOREIGN KEY (id_estado_asistencia)
        REFERENCES catalogo_estado_asistencia(id_estado_asistencia)
        ON DELETE RESTRICT
);

-- =========================================
-- SPRINT 3: Issue #12 — Votaciones
-- =========================================

CREATE TABLE votacion_acuerdo (
    id_votacion      SERIAL PRIMARY KEY,
    id_sesion        INT NOT NULL,
    id_propuesta     INT NOT NULL,
    votos_favor      INT NOT NULL DEFAULT 0,
    votos_contra     INT NOT NULL DEFAULT 0,
    abstenciones     INT NOT NULL DEFAULT 0,
    resultado        VARCHAR(20),
    fecha_votacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    es_firme         BOOLEAN DEFAULT FALSE,

    CONSTRAINT uq_votacion_sesion_propuesta
        UNIQUE (id_sesion, id_propuesta),

    CONSTRAINT fk_votacion_sesion
        FOREIGN KEY (id_sesion)
        REFERENCES sesiones(id_sesion)
        ON DELETE RESTRICT,

    CONSTRAINT fk_votacion_propuesta
        FOREIGN KEY (id_propuesta)
        REFERENCES propuesta(id_propuesta)
        ON DELETE RESTRICT,

    CONSTRAINT chk_votos_positivos
        CHECK (votos_favor >= 0 AND votos_contra >= 0 AND abstenciones >= 0),

    CONSTRAINT chk_resultado
        CHECK (resultado IN ('Aprobada', 'Rechazada', NULL))
);

-- Trigger que bloquea modificar una votación ya firmada
CREATE OR REPLACE FUNCTION fn_no_modificar_votacion_firme()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.es_firme = TRUE THEN
        RAISE EXCEPTION
            'Esta votación ya fue firmada y no puede modificarse.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_votacion_firme
BEFORE UPDATE ON votacion_acuerdo
FOR EACH ROW
EXECUTE FUNCTION fn_no_modificar_votacion_firme();

-- Función que calcula el resultado de una votación
-- tipo_mayoria: 1 = Simple, 2 = Calificada
CREATE OR REPLACE FUNCTION calcular_resultado_votacion(
    p_votos_favor  INT,
    p_votos_contra INT,
    p_id_sesion    INT,
    p_id_tipo_mayoria INT
)
RETURNS VARCHAR AS $$
DECLARE
    v_total_presentes INT;
    v_umbral          NUMERIC;
BEGIN
    -- Obtener total de presentes en la sesión
    SELECT COUNT(*) INTO v_total_presentes
    FROM asistencia_sesion_plenaria asp
    JOIN catalogo_estado_asistencia cea
        ON asp.id_estado_asistencia = cea.id_estado_asistencia
    WHERE asp.id_sesion = p_id_sesion
      AND cea.nombre = 'Presente';

    -- Mayoría Simple: votos_favor > votos_contra
    IF p_id_tipo_mayoria = 1 THEN
        IF p_votos_favor > p_votos_contra THEN
            RETURN 'Aprobada';
        ELSE
            RETURN 'Rechazada';
        END IF;
    END IF;

    -- Mayoría Calificada: votos_favor >= 66% de presentes
    IF p_id_tipo_mayoria = 2 THEN
        v_umbral := CEIL(v_total_presentes * 0.66);
        IF p_votos_favor >= v_umbral THEN
            RETURN 'Aprobada';
        ELSE
            RETURN 'Rechazada';
        END IF;
    END IF;

    RETURN 'Rechazada';
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- SPRINT 3: Issue #13 — Anulación de certificaciones
-- =========================================

CREATE TABLE anulacion_certificacion (
    id_anulacion     SERIAL PRIMARY KEY,
    id_certificacion INT NOT NULL,
    motivo           TEXT NOT NULL,
    usuario_anula    VARCHAR(80) NOT NULL,
    fecha_anulacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anulacion_certificacion
        FOREIGN KEY (id_certificacion)
        REFERENCES certificacion_emitida(id_certificacion)
        ON DELETE RESTRICT
);
