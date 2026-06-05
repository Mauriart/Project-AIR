DROP TABLE IF EXISTS asistencia_sesion_comision CASCADE;
DROP TABLE IF EXISTS sesion_comision CASCADE;
DROP TABLE IF EXISTS integrante_comision CASCADE;
DROP TABLE IF EXISTS comision CASCADE;

CREATE TABLE comision (
    id_comision SERIAL PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    descripcion TEXT,

    estado VARCHAR(20) DEFAULT 'Activa',

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE integrante_comision (
    id_integrante SERIAL PRIMARY KEY,

    id_comision INTEGER NOT NULL,

    asambleista_id INTEGER NOT NULL,

    rol VARCHAR(50) NOT NULL,

    fecha_inicio DATE NOT NULL,

    fecha_fin DATE,

    estado VARCHAR(20) DEFAULT 'Activo',

    CONSTRAINT fk_integrante_comision
        FOREIGN KEY (id_comision)
        REFERENCES comision(id_comision),

    CONSTRAINT fk_integrante_asambleista
        FOREIGN KEY (asambleista_id)
        REFERENCES asambleista(asambleista_id)
);

CREATE TABLE sesion_comision (
    id_sesion SERIAL PRIMARY KEY,

    id_comision INTEGER NOT NULL,

    fecha TIMESTAMP NOT NULL,

    descripcion TEXT,

    CONSTRAINT fk_sesion_comision
        FOREIGN KEY (id_comision)
        REFERENCES comision(id_comision)
);

CREATE TABLE asistencia_sesion_comision (
    id_asistencia SERIAL PRIMARY KEY,

    id_sesion INTEGER NOT NULL,

    asambleista_id INTEGER NOT NULL,

    estado_asistencia VARCHAR(20) NOT NULL,

    CONSTRAINT fk_asistencia_sesion
        FOREIGN KEY (id_sesion)
        REFERENCES sesion_comision(id_sesion),

    CONSTRAINT fk_asistencia_asambleista
        FOREIGN KEY (asambleista_id)
        REFERENCES asambleista(asambleista_id)
);

ALTER TABLE asistencia_sesion_comision
ADD CONSTRAINT uq_asistencia_sesion_asambleista
UNIQUE (id_sesion, asambleista_id);