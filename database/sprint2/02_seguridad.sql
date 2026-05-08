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
    id_logo SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    detalle VARCHAR(200) NOT NULL,
    registro_id INT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Constraint fk_log_usuario
        FOREIGN KEY (id_usuario) REFERENCES sys_usuario(id_usuario)
);