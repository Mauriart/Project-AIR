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

    estado VARCHAR(20) NOT NULL, -- Estado del nombramiento

    CONSTRAINT fk_nombramiento_asambleista -- Clave foránea que referencia a la tabla asambleista
        FOREIGN KEY (asambleista_id)
        REFERENCES asambleista(asambleista_id)
);

