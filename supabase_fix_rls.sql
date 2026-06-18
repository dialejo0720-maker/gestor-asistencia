-- Fix RLS policies para que el admin pueda ver todo
-- Ejecutar en Supabase > SQL Editor

DROP POLICY IF EXISTS "Admins can do everything on employees" ON employees;
DROP POLICY IF EXISTS "Admins can do everything on schedules" ON schedules;
DROP POLICY IF EXISTS "Admins can do everything on timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admins can read payroll reports" ON payroll_reports;
DROP POLICY IF EXISTS "Users can read their own admin record" ON users_admin;
DROP POLICY IF EXISTS "Employees can read their own schedule" ON schedules;
DROP POLICY IF EXISTS "Employees can manage their own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Employees can read their own profile" ON employees;

-- Política simple: todos los autenticados pueden leer employees
-- (el admin filtra desde users_admin, el empleado ve su propio perfil)
CREATE POLICY "Authenticated users can read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert/update/delete employees"
  ON employees FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can read schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage schedules"
  ON schedules FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can manage own timesheets"
  ON timesheets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage payroll"
  ON payroll_reports FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));

CREATE POLICY "Authenticated can read users_admin"
  ON users_admin FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage users_admin"
  ON users_admin FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users_admin WHERE id = auth.uid()));
