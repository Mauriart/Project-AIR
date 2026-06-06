# Reglas de Git — Sistema de Gestión AIR

> **Regla de oro:** Si el código no está en la rama oficial del sprint activo, no existe para efectos de evaluación. No se revisan ramas locales ni ramas personales.

---

## 1. Estructura de ramas

| Rama | Propósito | ¿Quién puede hacer merge? |
|------|-----------|--------------------------|
| `main` | Versión estable y final. Solo se toca al cerrar Sprint 3. | Solo el líder |
| `develop` | Integración del Sprint 2. Todo el trabajo del equipo confluye aquí. | Solo el líder (via PR aprobado) |
| `feature/issue-N-descripcion` | Rama personal de trabajo por cada issue. | Cada integrante en la suya |
| `fix/issue-N-descripcion` | Para correcciones sobre trabajo ya integrado. | Cada integrante en la suya |

### Regla de ubicación por sprint

- **Sprint 2 → rama `develop`**: todo avance (SQL, modelos, controladores, vistas) debe estar integrado en `develop` antes de la fecha de cierre.
- **Sprint 3 → rama `main`**: el producto final pasa de `develop` a `main` mediante un Pull Request formal. Solo se evalúa lo que esté en `main`.

---

## 2. Notación de commits (obligatoria)

Cada commit debe seguir el formato **Conventional Commits**:

```
tipo(modulo): descripcion breve en minusculas
```

### Tipos permitidos

| Tipo | Cuándo usarlo | Ejemplo |
|------|---------------|---------|
| `feat` | Nueva funcionalidad | `feat(asambleistas): agregar formulario de registro` |
| `fix` | Corrección de un error | `fix(votos): corregir calculo de mayoria calificada` |
| `db` | Cambios en scripts SQL o base de datos | `db(normativa): crear tabla recursiva elemento_normativo` |
| `docs` | Cambios en documentación o README | `docs(readme): actualizar instrucciones de instalacion` |

### Módulos válidos

`seguridad` · `asambleistas` · `nombramientos` · `normativa` · `sesiones` · `votaciones` · `comisiones` · `certificaciones` · `foliado` · `auditoria` · `buscador`

### ❌ Mensajes que NO se aceptan

```
# Estos generan penalización automática:
git commit -m "cambios"
git commit -m "arreglo"
git commit -m "subiendo archivo"
git commit -m "."
git commit -m "avance sprint"
git commit -m "listo"
```

---

## 3. Flujo de trabajo diario

```
1. INICIO DEL DÍA
   → Mover el issue de "Ready for Sprint" a "In Progress" en el tablero.

2. CREAR LA RAMA (solo la primera vez por issue)
   git checkout develop
   git pull origin develop
   git checkout -b feature/issue-9-asambleistas

3. TRABAJAR Y HACER COMMITS FRECUENTES
   git add .
   git commit -m "db(asambleistas): crear tabla con campos cedula y correo"
   git push origin feature/issue-9-asambleistas

4. AL TERMINAR EL ISSUE → ABRIR PULL REQUEST
   - Base: develop
   - Título: "feat(asambleistas): registro completo con validaciones"
   - Descripción: incluir "Closes #9" para cerrar el issue automáticamente
   - Mover el issue a "In Review" en el tablero.

5. EL LÍDER REVISA Y HACE MERGE
   → El issue pasa a "Done" automáticamente.
```

---

## 4. Reglas del tablero (GitHub Project)

El tablero debe reflejar el trabajo real en todo momento. Las columnas son:

| Columna | Significado |
|---------|-------------|
| **Backlog** | Issues que aún no se han empezado |
| **Ready for Sprint** | Issues del sprint actual con requisitos claros |
| **In Progress** | En desarrollo activo. Máximo 2 issues por persona simultáneamente |
| **In Review** | PR abierto, esperando revisión y merge a `develop` |
| **Done** | Cerrado, probado y con código en la rama oficial |

### Regla de la "Verdad Única"

- Si un issue está en **In Progress** → el código debe estar en una rama activa.
- Si un issue está en **Done** → el código debe estar en `develop` (Sprint 2) o `main` (Sprint 3).
- Un issue en **Done** sin código en la rama oficial = penalización por "no entregado".

> El Git registra fechas y movimientos. No se puede mover un issue a Done manualmente sin el Pull Request correspondiente.

---

## 5. Pull Requests

Todo Pull Request debe cumplir con:

- **Base branch**: `develop` (Sprint 2) o `main` (Sprint 3).
- **Título claro**: que describa qué hace el PR, no "mi issue listo".
- **Descripción**: incluir obligatoriamente `Closes #N` donde N es el número del issue.
- **Sin conflictos**: resolver cualquier conflicto con `develop` antes de pedir revisión.

```markdown
<!-- Ejemplo de descripción de PR -->
## Qué hace este PR
Implementa el registro de asambleístas con validación de cédula y lógica
de nombramientos históricos sin traslape de fechas.

## Issue relacionado
Closes #9

## Cómo probarlo
1. Ir a /asambleistas/nuevo
2. Ingresar cédula con formato 3-0248-0440
3. Verificar que el sistema rechaza cédulas duplicadas
```

---

## 6. Penalizaciones

| Infracción | Penalización |
|------------|-------------|
| Código en rama incorrecta al momento de revisión | Nota 0 en ese entregable |
| Scripts de BD fuera de `/database` o diccionario desactualizado | -10% |
| Commit con mensaje genérico ("cambios", "arreglo", ".") | -5% por incidencia (máx. -20%) |
| No usar prefijos `feat/fix/db` | -5% por incidencia (máx. -20%) |
| Todos los cambios del sprint en un solo commit el último día | -5% por incidencia (máx. -20%) |
| Issue en Done sin PR asociado | Penalización por "no entregado" |
| Lógica de negocio en archivos de `/views` | Pérdida del puntaje MVC completo |

---

## 7. Checklist antes de abrir un PR

Antes de marcar tu issue como listo, verificá:

- [ ] El código está en mi rama `feature/issue-N-...`, no en `develop` ni `main`.
- [ ] Hice al menos 3 commits con mensajes en formato correcto (no todo en uno).
- [ ] La lógica de negocio está en `/controllers`, no en `/views`.
- [ ] Las consultas SQL están en `/models`, no en el controlador.
- [ ] El PR tiene `Closes #N` en la descripción.
- [ ] No hay archivos `.env`, `node_modules` ni temporales subidos al repo.
- [ ] El issue está movido a "In Review" en el tablero.

---
