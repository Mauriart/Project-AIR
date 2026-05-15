-- Issue #10
-- Seccion 1: Tablas de Normativa
create table reglamento(
    id_reglamento serial primary key,
    nombre_normativa varchar(200) not null,
    sigla varchar(10) unique not null,
);
-- tabla recursiva elemento_normativo
create table elemnento_normativo(
    id_elemento serial primary key,
    id_reglamento int not null,
    id_elemento_padre int,
    id_nivel_reglamento int not null,
    numero_etiqueta int not null,
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
        references elemnento_normativo(id_elemento),
    constraint fk_nivel_reglamento
        foreign key (id_nivel_reglamento)
        references reglamento(id_reglamento),
    constraint fk_estado_vigencia
        foreign key (id_estado_vigencia)
        references estado_vigencia(id_estado_vigencia)
);

-- Partial Unique Index
create unique index idx_unicidad_vigente
    on elemnento_normativo(id_elemento_padre, numero_etiqueta, id_reglamento)
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
            where nombre = 'Historico'
        )
    where 
        id_elemento = new.id_elemento
        and id_elemento_padre = new.id_elemento_padre
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
    references propuesta(id_propuesta)
);

create table resolucion(
  id_resolucion SERIAL PRIMARY KEY,
  id_punto_agenda int not null,
  numero_resolucion varchar(20) not null,
  fecha_emision date not null,

  constraint fk_resolucion_agenda
    foreign key (id_punto_agenda)
    references punto_agenda(id_punto_agenda)
);
