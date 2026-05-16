# Diccionario de Datos — Sistema de Gestión AIR
**Instituto Tecnológico de Costa Rica**  
**Asamblea Institucional Representativa (AIR)**  
**Sprint 2 — Versión 1.0**

---

## Índice

1. [Catálogos Base](#1-catálogos-base)
2. [Módulo de Seguridad](#2-módulo-de-seguridad-issue-0)
3. [Módulo de Normativa](#3-módulo-de-normativa-issue-10)
4. [Módulo de Asambleístas](#4-módulo-de-asambleístas-issue-9)
5. [Vistas](#5-vistas)
6. [Triggers y Funciones](#6-triggers-y-funciones)

---

## 1. Catálogos Base

Los catálogos son tablas de referencia con valores fijos que otras tablas referencian mediante FK. Todos siguen la misma estructura: un ID autoincremental y un nombre único.

---

### catalogo_sector
Almacena los sectores de representación que puede tener un asambleísta.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_sector | SERIAL | PK | Identificador único del sector |
| nombre | VARCHAR(80) | UNIQUE, NOT NULL | Nombre del sector (ej. Docente, Estudiante) |

**Valores semilla:** Docente, Estudiante, Administrativo, Egresado, Funcionario

---

### catalogo_puestos
Almacena los puestos que puede ocupar un asambleísta dentro de la AIR.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_puesto | SERIAL | PK | Identificador único del puesto |
| nombre_puesto | VARCHAR(80) | UNIQUE, NOT NULL | Nombre del puesto (ej. Presidente, Secretario) |

**Valores semilla:** Presidente, Vicepresidente, Secretario, Vocal

---

### catalogo_nivel_reglamento
Define los niveles jerárquicos que puede tener un elemento normativo.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_nivel_reglamento | SERIAL | PK | Identificador único del nivel |
| nombre | VARCHAR(80) | UNIQUE, NOT NULL | Nombre del nivel (ej. Título, Artículo) |

**Valores semilla:** Título, Capítulo, Artículo, Inciso, Sub-inciso  
**Orden jerárquico:** Título → Capítulo → Artículo → Inciso → Sub-inciso

---

### catalogo_estado_vigencia
Define los posibles estados de vigencia de un elemento normativo.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_estado_vigencia | SERIAL | PK | Identificador único del estado |
| nombre | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del estado |

**Valores semilla:** Vigente, Histórico, Derogado  
**Regla:** Solo un elemento puede tener estado Vigente por artículo al mismo tiempo (garantizado por Partial Unique Index).

---

### catalogo_tipo_sesion
Define los tipos de sesión que puede celebrar la AIR.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_tipo_sesion | SERIAL | PK | Identificador único del tipo |
| nombre | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del tipo de sesión |

**Valores semilla:** Ordinaria, Extraordinaria

---

### catalogo_tipo_modalidad
Define la modalidad en que se puede realizar una sesión.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_tipo_modalidad | SERIAL | PK | Identificador único de la modalidad |
| nombre | VARCHAR(50) | UNIQUE, NOT NULL | Nombre de la modalidad |

**Valores semilla:** Presencial, Virtual, Híbrida

---

### catalogo_etapas_propuestas
Define las etapas por las que puede pasar una propuesta legislativa.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_etapa_propuesta | SERIAL | PK | Identificador único de la etapa |
| nombre | VARCHAR(50) | UNIQUE, NOT NULL | Nombre de la etapa |

**Valores semilla:** Procedencia, Aprobación  
**Nota:** Procedencia es la etapa inicial de análisis. Aprobación es la votación final.

---

### catalogo_estado_propuesta
Define los posibles estados de una propuesta durante su ciclo de vida.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_estado_propuesta | SERIAL | PK | Identificador único del estado |
| nombre | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del estado |

**Valores semilla:** Pendiente de revisión, En discusión, Aprobada, Rechazada

---

### catalogo_tipo_mayoria_requerida
Define el tipo de mayoría necesaria para aprobar una propuesta.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_tipo_mayoria_requerida | SERIAL | PK | Identificador único del tipo |
| nombre | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del tipo de mayoría |

**Valores semilla:** Simple (50%+1), Calificada (66% de los presentes)

---

## 2. Módulo de Seguridad (Issue #0)

Gestiona la autenticación, autorización y auditoría del sistema mediante RBAC (Role-Based Access Control).

---

### sys_usuario
Almacena las credenciales de acceso de los usuarios del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_usuario | SERIAL | PK | Identificador único del usuario |
| username | VARCHAR(80) | UNIQUE, NOT NULL | Nombre de usuario para login |
| password_hash | VARCHAR(255) | NOT NULL | Contraseña cifrada con BCrypt (nunca texto plano) |
| email | VARCHAR(150) | UNIQUE, NOT NULL | Correo electrónico del usuario |
| activo | BOOLEAN | DEFAULT TRUE | Indica si el usuario puede acceder al sistema |

**Nota de seguridad:** El campo `password_hash` nunca almacena la contraseña original. Usa BCrypt con factor de costo 10.

---

### sys_rol
Define los roles disponibles en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_rol | SERIAL | PK | Identificador único del rol |
| nombre_rol | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del rol |

**Roles del sistema:**
- `SECRETARIA` — autoridad máxima, emite certificaciones y cierra actas
- `ASISTENTE` — carga datos y prepara borradores
- `CONSULTA` — solo lectura del compilador de reglamentos

---

### sys_permiso
Define los permisos individuales que se asignan a los roles.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_permiso | SERIAL | PK | Identificador único del permiso |
| nombre_permiso | VARCHAR(50) | UNIQUE, NOT NULL | Nombre del permiso (ej. EMITIR_CERTIFICACION) |
| description | VARCHAR(200) | NOT NULL | Descripción de lo que permite hacer |

---

### sys_usuario_rol
Tabla intermedia que relaciona usuarios con roles (relación N:M).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_usuario | INT | PK, FK → sys_usuario | Usuario al que se le asigna el rol |
| id_rol | INT | PK, FK → sys_rol | Rol asignado al usuario |

**Nota:** La PK es compuesta (id_usuario, id_rol). Un usuario puede tener múltiples roles.

---

### sys_rol_permiso
Tabla intermedia que relaciona roles con permisos (relación N:M).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_rol | INT | PK, FK → sys_rol | Rol al que se le asigna el permiso |
| id_permiso | INT | PK, FK → sys_permiso | Permiso asignado al rol |

**Nota:** La PK es compuesta (id_rol, id_permiso).

---

### sys_log_auditoria
Registro inmutable de todas las acciones críticas realizadas en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_log | SERIAL | PK | Identificador único del registro |
| id_usuario | INT | NOT NULL, FK → sys_usuario | Usuario que realizó la acción |
| accion | VARCHAR(50) | NOT NULL | Tipo de acción (ej. LOGIN, INSERT, UPDATE) |
| tabla_afectada | VARCHAR(50) | NOT NULL | Tabla sobre la que se realizó la acción |
| detalle | VARCHAR(200) | NOT NULL | Descripción detallada de la acción |
| ip_origen | VARCHAR(45) | NOT NULL | Dirección IP desde donde se realizó la acción |
| registro_id | INT | NULL | ID del registro afectado (si aplica) |
| fecha_hora | TIMESTAMP | DEFAULT NOW() | Fecha y hora exacta del servidor |

**Nota de integridad:** Este registro no debe poder modificarse ni eliminarse una vez creado.

---

## 3. Módulo de Normativa (Issue #10)

Gestiona la estructura jerárquica de los reglamentos del TEC y el ciclo de vida de las propuestas legislativas.

---

### reglamento
Entidad raíz que representa un reglamento institucional.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_reglamento | SERIAL | PK | Identificador único del reglamento |
| nombre_normativa | VARCHAR(200) | NOT NULL | Nombre completo del reglamento |
| sigla | VARCHAR(10) | UNIQUE, NOT NULL | Sigla identificadora (ej. EO-ITCR, RAIR) |

**Registros semilla:** Estatuto Orgánico del ITCR (EO-ITCR), Reglamento de la AIR (RAIR), Reglamento del Consejo Institucional (RCI)

---

### elemento_normativo
Tabla recursiva que representa cualquier nivel de la jerarquía normativa (Título, Capítulo, Artículo, Inciso, Sub-inciso). Cada fila puede ser padre de otras filas de la misma tabla.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_elemento | SERIAL | PK | Identificador único del elemento |
| id_reglamento | INT | NOT NULL, FK → reglamento | Reglamento al que pertenece |
| id_elemento_padre | INT | NULL, FK → elemento_normativo | Elemento padre en la jerarquía. NULL si es raíz |
| id_nivel_reglamento | INT | NOT NULL, FK → catalogo_nivel_reglamento | Nivel jerárquico del elemento |
| numero_etiqueta | VARCHAR(20) | NOT NULL | Identificador legal visible (ej. I, 1, a), i.) |
| contenido_texto | TEXT | NULL | Texto completo del elemento normativo |
| orden | INT | NOT NULL | Posición dentro del mismo nivel y padre |
| fecha_inicio_vigencia | DATE | NOT NULL, DEFAULT CURRENT_DATE | Fecha desde la que rige este elemento |
| fecha_fin_vigencia | DATE | NULL | Fecha en que dejó de regir. NULL si está vigente |
| id_estado_vigencia | INT | NOT NULL, FK → catalogo_estado_vigencia | Estado actual del elemento |

**Índice especial:** `idx_unicidad_vigente` — Partial Unique Index sobre (id_elemento_padre, numero_etiqueta, id_reglamento) donde fecha_fin_vigencia IS NULL. Garantiza la Regla de Oro: no pueden existir dos versiones vigentes del mismo artículo.

**Relación recursiva:** `id_elemento_padre` apunta a otra fila de la misma tabla, permitiendo profundidad ilimitada.

---

### sesiones
Registra las sesiones plenarias de la AIR.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_sesion | SERIAL | PK | Identificador único de la sesión |
| id_tipo_modalidad | INT | NOT NULL, FK → catalogo_tipo_modalidad | Modalidad de la sesión |
| id_tipo_sesion | INT | NOT NULL, FK → catalogo_tipo_sesion | Tipo de sesión |
| numero_sesion | VARCHAR(20) | NOT NULL | Número oficial de la sesión (ej. AIR-110-2024) |
| fecha | DATE | NOT NULL | Fecha de realización |
| link_acta | VARCHAR(200) | NULL | URL al acta oficial en el repositorio del TEC |
| quorum | INT | NOT NULL | Número mínimo de asambleístas requeridos para sesionar válidamente |

---

### propuesta
Registra las propuestas y mociones presentadas ante la AIR. Es recursiva: una propuesta conciliada puede apuntar a su propuesta base de origen.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_propuesta | SERIAL | PK | Identificador único de la propuesta |
| id_reglamento_base | INT | NULL, FK → reglamento | Reglamento que se propone modificar |
| id_etapa_propuesta | INT | NOT NULL, FK → catalogo_etapas_propuestas | Etapa actual de la propuesta |
| id_estado_propuesta | INT | NOT NULL, FK → catalogo_estado_propuesta | Estado actual de la propuesta |
| id_propuesta_padre | INT | NULL, FK → propuesta | Propuesta base de origen (solo para conciliadas) |
| titulo | VARCHAR(200) | NOT NULL | Título descriptivo de la propuesta |
| texto_sustitutivo | TEXT | NULL | Texto completo que reemplazaría al artículo vigente |
| codigo_air | VARCHAR(50) | NULL | Código oficial asignado (ej. AIR-001-2026) |
| id_tipo_mayoria_requerida | INT | NOT NULL, FK → catalogo_tipo_mayoria_requerida | Tipo de mayoría necesaria para aprobarla |

**Relación recursiva:** `id_propuesta_padre` permite vincular propuestas conciliadas con sus propuestas base.

---

### punto_agenda
Registra los puntos del orden del día de una sesión, vinculando sesiones con propuestas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_punto_agenda | SERIAL | PK | Identificador único del punto |
| id_sesion | INT | NOT NULL, FK → sesiones | Sesión en la que se agenda el punto |
| id_propuesta | INT | NOT NULL, FK → propuesta | Propuesta que se discute en este punto |
| orden | INT | NOT NULL | Posición del punto en el orden del día |
| descripcion | TEXT | NULL | Descripción adicional del punto de agenda |

---

### resolucion_propuesta
Registra el número de resolución oficial que formaliza la aprobación de una propuesta.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| id_resolucion_propuesta | SERIAL | PK | Identificador único de la resolución |
| id_punto_agenda | INT | NOT NULL, FK → punto_agenda | Punto de agenda que generó esta resolución |
| numero_resolucion | VARCHAR(20) | NOT NULL | Número oficial de la resolución (ej. AIR-RES-001-2026) |
| fecha_emision | DATE | NOT NULL | Fecha de emisión de la resolución |

**Importancia legal:** El número de resolución es el dato que aparece en las certificaciones emitidas para carrera profesional.

---

## 4. Módulo de Asambleístas (Issue #9)

Gestiona el padrón de asambleístas, sus nombramientos históricos y la trazabilidad de cambios de identidad.

---

### asambleista
Almacena la identidad permanente de cada asambleísta. Esta tabla NO cambia cuando alguien cambia de sector — el sector va en la tabla nombramiento.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| asambleista_id | SERIAL | PK | Identificador único del asambleísta |
| cedula | VARCHAR(12) | UNIQUE, NOT NULL, CHECK formato | Cédula de identidad. Formato: 8 a 12 dígitos numéricos |
| nombre | VARCHAR(150) | NOT NULL | Nombre completo del asambleísta |
| correo_institucional | VARCHAR(150) | UNIQUE, NOT NULL | Correo institucional del TEC |

**Restricción:** La cédula debe cumplir el patrón `^[0-9]{8,12}$`.

---

### resolucion
Almacena las resoluciones oficiales que respaldan los nombramientos de asambleístas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| resolucion_id | SERIAL | PK | Identificador único de la resolución |
| numero_resolucion | VARCHAR(50) | UNIQUE, NOT NULL | Número oficial de la resolución |
| descripcion | TEXT | NULL | Descripción del contenido de la resolución |
| fecha_resolucion | DATE | NOT NULL | Fecha de emisión de la resolución |

---

### nombramiento
Registra los períodos en que un asambleísta ha representado un sector. Una misma persona puede tener múltiples nombramientos históricos sin sobreescribir los anteriores.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| nombramiento_id | SERIAL | PK | Identificador único del nombramiento |
| asambleista_id | INT | NOT NULL, FK → asambleista | Asambleísta al que corresponde |
| sector_id | INT | NOT NULL, FK → catalogo_sector | Sector que representa en este período |
| id_puesto | INT | NOT NULL, FK → catalogo_puestos | Puesto que ocupa en este período |
| resolucion_id | INT | NOT NULL, FK → resolucion | Resolución que respalda el nombramiento |
| fecha_inicio | DATE | NOT NULL | Inicio del período de nombramiento |
| fecha_fin | DATE | NULL | Fin del período. NULL si el nombramiento está activo |
| estado | VARCHAR(20) | NOT NULL, CHECK | Estado del nombramiento: ACTIVO, FINALIZADO, SUSPENDIDO |

**Regla de integridad:** No puede haber dos nombramientos activos que se traslapen en fechas para el mismo asambleísta. Garantizado por el trigger `trigger_validar_traslape`.

---

### bitacora_asambleistas
Registra los cambios de nombre o cédula de un asambleísta, por ejemplo por resolución del TSE por razones de identidad de género o nacionalización.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|--------------|-------------|
| bitacora_id | SERIAL | PK | Identificador único del registro |
| asambleista_id | INT | NOT NULL, FK → asambleista | Asambleísta afectado |
| cedula_anterior | VARCHAR(12) | NULL | Cédula antes del cambio |
| cedula_nueva | VARCHAR(12) | NULL | Cédula después del cambio |
| nombre_anterior | VARCHAR(150) | NULL | Nombre antes del cambio |
| nombre_nuevo | VARCHAR(150) | NULL | Nombre después del cambio |
| razon_cambio | TEXT | NOT NULL | Justificación del cambio de identidad |
| fecha_cambio | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha y hora exacta del cambio |

**Activación:** Se llena automáticamente mediante el trigger `trigger_bitacora_asambleistas` cuando se actualiza nombre o cédula en la tabla asambleista.

---

## 5. Vistas

### vw_asambleistas_nombramientos
Vista que consolida la información de asambleístas con su nombramiento activo, calculando dinámicamente si el nombramiento está vigente.

| Campo | Origen | Descripción |
|-------|--------|-------------|
| asambleista_id | asambleista | ID del asambleísta |
| nombre | asambleista | Nombre completo |
| cedula | asambleista | Cédula de identidad |
| correo_institucional | asambleista | Correo del TEC |
| nombramiento_id | nombramiento | ID del nombramiento |
| fecha_inicio | nombramiento | Inicio del período |
| fecha_fin | nombramiento | Fin del período |
| estado | nombramiento | Estado del nombramiento |
| vigencia | calculado | VIGENTE si fecha_fin IS NULL, INACTIVO si tiene fecha |

---

## 6. Triggers y Funciones

### tg_vigencia_normativa
| Atributo | Valor |
|----------|-------|
| Tabla | elemento_normativo |
| Evento | BEFORE INSERT |
| Función | fn_vigencia_normativa() |
| Propósito | Versionamiento automático de normativa |

**Lógica:** Cuando se inserta una nueva versión de un artículo, busca la versión anterior activa (fecha_fin_vigencia IS NULL) bajo el mismo padre y con la misma etiqueta, le asigna la fecha de fin del día actual y cambia su estado a Histórico. La nueva versión queda como la vigente.

---

### trigger_validar_traslape
| Atributo | Valor |
|----------|-------|
| Tabla | nombramiento |
| Evento | BEFORE INSERT |
| Función | validar_traslape_nombramientos() |
| Propósito | Integridad histórica de nombramientos |

**Lógica:** Verifica que el nuevo nombramiento no se superponga en fechas con un nombramiento existente del mismo asambleísta. Si hay traslape, lanza RAISE EXCEPTION y cancela la inserción.

---

### trigger_bitacora_asambleistas
| Atributo | Valor |
|----------|-------|
| Tabla | asambleista |
| Evento | BEFORE UPDATE |
| Función | registrar_cambio_asambleista() |
| Propósito | Trazabilidad de cambios de identidad |

**Lógica:** Cuando se actualiza el nombre o la cédula de un asambleísta, registra automáticamente los valores anteriores y nuevos en bitacora_asambleistas con la razón del cambio.

---

## Índices

| Índice | Tabla | Campo(s) | Tipo | Propósito |
|--------|-------|----------|------|-----------|
| idx_unicidad_vigente | elemento_normativo | id_elemento_padre, numero_etiqueta, id_reglamento | UNIQUE PARTIAL (WHERE fecha_fin_vigencia IS NULL) | Regla de Oro: una sola versión vigente por artículo |
| idx_asambleista_cedula | asambleista | cedula | BTREE | Búsqueda rápida por cédula |
| idx_nombramiento_estado | nombramiento | estado | BTREE | Filtrado eficiente de nombramientos activos |

---

*Documento generado para el Sprint 2 del Sistema de Gestión Legislativa AIR — TEC*  
*Última actualización: Mayo 2026*
