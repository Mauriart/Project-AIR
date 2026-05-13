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

