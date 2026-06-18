-- ==============================================
-- GESTOR DE ASISTENCIA - Setup Supabase
-- Ejecutar en: Supabase > SQL Editor
-- ==============================================

-- TABLA: Empleados
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  store VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'vendedor',
  salario_diario DECIMAL(10,2) DEFAULT 30000,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Horarios cargados
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  hora_salida TIME NOT NULL,
  es_festivo BOOLEAN DEFAULT false,
  es_fuera_horario BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, fecha)
);

-- TABLA: Registros de entrada/salida
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  ubicacion_texto VARCHAR(255),
  notas VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, fecha)
);

-- TABLA: Reportes de nómina
CREATE TABLE IF NOT EXISTS payroll_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  horas_normales DECIMAL(10,2),
  horas_extras DECIMAL(10,2),
  horas_festivas DECIMAL(10,2),
  dias_trabajados INTEGER,
  dias_ausentes INTEGER,
  total_horas DECIMAL(10,2),
  generado_por_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, mes, ano)
);

-- TABLA: Usuarios admin (supervisores/admins del dashboard)
CREATE TABLE IF NOT EXISTS users_admin (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol VARCHAR(50) NOT NULL DEFAULT 'supervisor',
  permisos JSONB DEFAULT '{"puede_ver_todas_tiendas": true, "puede_generar_nomina": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_admin ENABLE ROW LEVEL SECURITY;

-- Policies: admins ven todo, empleados solo sus datos
CREATE POLICY "Admins can do everything on employees"
  ON employees FOR ALL
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Admins can do everything on schedules"
  ON schedules FOR ALL
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Admins can do everything on timesheets"
  ON timesheets FOR ALL
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Employees can read their own schedule"
  ON schedules FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Employees can manage their own timesheets"
  ON timesheets FOR ALL
  USING (employee_id IN (SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Employees can read their own profile"
  ON employees FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can read payroll reports"
  ON payroll_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Users can read their own admin record"
  ON users_admin FOR SELECT
  USING (id = auth.uid());

-- ==============================================
-- DATA DE PRUEBA
-- ==============================================

-- Insertar empleados de prueba
INSERT INTO employees (nombre, email, store, rol, salario_diario, activo) VALUES
('Juan García', 'juan@empresa.com', 'Centro', 'vendedor', 30000, true),
('María López', 'maria@empresa.com', 'Centro', 'vendedor', 30000, true),
('Carlos Ruiz', 'carlos@empresa.com', 'Norte', 'supervisor', 40000, true),
('Ana Rodríguez', 'ana@empresa.com', 'Sur', 'vendedor', 30000, true),
('Pedro Castillo', 'pedro@empresa.com', 'Oriente', 'vendedor', 30000, true)
ON CONFLICT (email) DO NOTHING;

-- Insertar horarios de junio 2026 (lunes a viernes)
INSERT INTO schedules (employee_id, fecha, hora_entrada, hora_salida, es_festivo)
SELECT
  e.id,
  (DATE '2026-06-01' + (n || ' days')::INTERVAL)::DATE as fecha,
  '08:00'::TIME,
  '17:00'::TIME,
  FALSE
FROM employees e
CROSS JOIN LATERAL generate_series(0, 29) n
WHERE EXTRACT(DOW FROM DATE '2026-06-01' + (n || ' days')::INTERVAL) NOT IN (0, 6)
ON CONFLICT (employee_id, fecha) DO NOTHING;

-- Insertar registros de asistencia de prueba para Juan (todo el mes, algunos con extras)
INSERT INTO timesheets (employee_id, fecha, check_in_time, check_out_time, ubicacion_texto)
SELECT
  e.id,
  (DATE '2026-06-01' + (n || ' days')::INTERVAL)::DATE as fecha,
  ((DATE '2026-06-01' + (n || ' days')::INTERVAL)::TIMESTAMP AT TIME ZONE 'America/Bogota' + '08:05:00'::INTERVAL) AT TIME ZONE 'UTC',
  ((DATE '2026-06-01' + (n || ' days')::INTERVAL)::TIMESTAMP AT TIME ZONE 'America/Bogota' + CASE WHEN n % 5 = 0 THEN '18:30:00' ELSE '17:30:00' END::INTERVAL) AT TIME ZONE 'UTC',
  'Centro - Bogotá'
FROM employees e
CROSS JOIN LATERAL generate_series(0, 25) n
WHERE e.email = 'juan@empresa.com'
  AND EXTRACT(DOW FROM DATE '2026-06-01' + (n || ' days')::INTERVAL) NOT IN (0, 6)
ON CONFLICT (employee_id, fecha) DO NOTHING;

-- ==============================================
-- INSTRUCCIONES PARA CREAR USUARIO ADMIN
-- ==============================================
-- 1. Ir a Supabase > Authentication > Users > Invite User
-- 2. Crear un usuario con tu email de admin
-- 3. Luego ejecutar esto con el UUID del usuario creado:
--
-- INSERT INTO users_admin (id, rol) VALUES ('UUID-DEL-USUARIO-ADMIN', 'admin');
--
-- También crear usuarios para cada empleado en Authentication > Users
-- y asegurarse que el email coincida con el de la tabla employees
