-- Estos son los catálogos base que todos referencian

CREATE TABLE catalogo_sector (
  id_sector  SERIAL PRIMARY KEY,
  nombre     VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE catalogo_puestos (
  id_puesto      SERIAL PRIMARY KEY,
  nombre_puesto  VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE catalogo_nivel_reglamento (
  id_nivel_reglamento  SERIAL PRIMARY KEY,
  nombre               VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE catalogo_estado_vigencia (
  id_estado_vigencia  SERIAL PRIMARY KEY,
  nombre              VARCHAR(50) UNIQUE NOT NULL
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