-- Este archivo es temporal, solo para que apliquen sobre la base que ya se tenia.
-- Ajuste idempotente de permisos por rol.
-- Ejecutar en bases existentes para que Asambleísta quede en solo lectura.

INSERT INTO sys_permiso (nombre_permiso, description) VALUES
  ('EMITIR_CERTIFICACION', 'Permite emitir certificaciones legales'),
  ('GESTIONAR_ASAMBLEISTAS', 'Permite registrar y editar asambleístas'),
  ('GESTIONAR_PROPUESTAS', 'Permite registrar propuestas y mociones'),
  ('VER_ASAMBLEISTAS', 'Permite consultar datos de asambleístas'),
  ('VER_REGLAMENTOS', 'Permite consultar el compilador normativo')
ON CONFLICT (nombre_permiso) DO NOTHING;

-- Asambleísta no debe conservar permisos de escritura si fueron asignados antes.
DELETE FROM sys_rol_permiso rp
USING sys_rol r, sys_permiso p
WHERE rp.id_rol = r.id_rol
  AND rp.id_permiso = p.id_permiso
  AND r.nombre_rol = 'Asambleísta'
  AND p.nombre_permiso NOT IN ('VER_ASAMBLEISTAS', 'VER_REGLAMENTOS');

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
WHERE r.nombre_rol = 'Administrador'
ON CONFLICT DO NOTHING;

INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
  'GESTIONAR_ASAMBLEISTAS',
  'GESTIONAR_PROPUESTAS',
  'VER_ASAMBLEISTAS',
  'VER_REGLAMENTOS'
)
WHERE r.nombre_rol = 'Secretaría'
ON CONFLICT DO NOTHING;

INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
  'VER_ASAMBLEISTAS',
  'VER_REGLAMENTOS'
)
WHERE r.nombre_rol = 'Asambleísta'
ON CONFLICT DO NOTHING;
