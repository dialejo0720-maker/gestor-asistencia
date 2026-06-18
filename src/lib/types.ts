export interface Employee {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  store: string;
  rol: 'vendedor' | 'supervisor' | 'gerente' | 'admin';
  salario_diario?: number;
  activo: boolean;
  created_at: string;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  fecha: string;
  check_in_time?: string;
  check_out_time?: string;
  ubicacion_texto?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  ubicacion_direccion?: string;
  notas?: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  employee_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  es_festivo: boolean;
  es_fuera_horario: boolean;
}

export interface Sale {
  id: string;
  employee_id: string;
  fecha: string;
  monto: number;
  descripcion?: string;
  store?: string;
  created_at: string;
}

export interface PayrollReport {
  id: string;
  employee_id: string;
  mes: number;
  ano: number;
  horas_normales: number;
  horas_extras: number;
  horas_festivas: number;
  dias_trabajados: number;
  dias_ausentes: number;
  total_horas: number;
  generado_por_user_id: string;
  created_at: string;
}

export interface DashboardData {
  empleado: Employee;
  entrada_hoy?: string;
  salida_hoy?: string;
  horas_hoy: number;
  horas_trabajadas_mes: number;
  horas_extras_mes: number;
  horas_festivas_mes: number;
  dias_trabajados: number;
  dias_ausentes: number;
  porcentaje_asistencia: number;
}
