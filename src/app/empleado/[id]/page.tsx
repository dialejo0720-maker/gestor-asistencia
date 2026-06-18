'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, getDaysInMonth, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Layout/Header';
import { Employee, Timesheet, Schedule } from '@/lib/types';
import { calculateMonthlyHours, calculateDailyHours, formatHoras } from '@/lib/calculateHours';
import { generatePayrollPDF } from '@/lib/generatePayroll';
import { isFestivo } from '@/lib/festivos';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function EmployeeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const mes = Number(searchParams.get('mes') || new Date().getMonth() + 1);
  const ano = Number(searchParams.get('ano') || new Date().getFullYear());

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const [{ data: emp }, { data: ts }, { data: sch }] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).single(),
      supabase.from('timesheets').select('*').eq('employee_id', id)
        .gte('fecha', `${ano}-${String(mes).padStart(2,'0')}-01`)
        .lte('fecha', `${ano}-${String(mes).padStart(2,'0')}-${String(getDaysInMonth(new Date(ano, mes-1))).padStart(2,'0')}`),
      supabase.from('schedules').select('*').eq('employee_id', id)
        .gte('fecha', `${ano}-${String(mes).padStart(2,'0')}-01`)
        .lte('fecha', `${ano}-${String(mes).padStart(2,'0')}-${String(getDaysInMonth(new Date(ano, mes-1))).padStart(2,'0')}`),
    ]);

    setEmployee(emp);
    setTimesheets((ts || []) as Timesheet[]);
    setSchedules((sch || []) as Schedule[]);
    setLoading(false);
  }, [id, mes, ano, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function downloadPDF() {
    if (!employee) return;
    const calc = calculateMonthlyHours(timesheets, schedules);
    const doc = generatePayrollPDF(employee, calc, mes, ano);
    doc.save(`nomina_${employee.nombre.replace(/\s/g,'_')}_${MESES[mes-1]}_${ano}.pdf`);
  }

  if (loading) return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!employee) return null;

  const calc = calculateMonthlyHours(timesheets, schedules);
  const totalHoras = calc.horasNormales + calc.horasExtras + calc.horasFestivas;
  const totalDias = calc.diasTrabajados + calc.diasAusentes;
  const pct = totalDias > 0 ? Math.round((calc.diasTrabajados / totalDias) * 100) : 0;

  const daysInMonth = getDaysInMonth(new Date(ano, mes - 1));
  const firstDayOfMonth = new Date(ano, mes - 1, 1).getDay();

  function getDayStatus(day: number): string {
    const fecha = `${ano}-${String(mes).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const date = new Date(ano, mes - 1, day);
    if (isWeekend(date)) return 'descanso';
    if (isFestivo(date)) return 'festivo';
    const ts = timesheets.find(t => t.fecha === fecha);
    if (ts?.check_in_time) return 'presente';
    const hasSch = schedules.find(s => s.fecha === fecha);
    if (hasSch) return 'ausente';
    return 'sin-horario';
  }

  const dayColors: Record<string, string> = {
    presente: 'bg-green-500 text-white',
    ausente: 'bg-red-400 text-white',
    descanso: 'bg-gray-200 text-gray-400',
    festivo: 'bg-purple-400 text-white',
    'sin-horario': 'bg-gray-100 text-gray-300',
  };

  const dayLabels: Record<string, string> = {
    presente: '✓', ausente: '✗', descanso: '○', festivo: 'F', 'sin-horario': '·'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`${employee.nombre}`} showBack />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-blue-600 text-white rounded-2xl p-5">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">{employee.nombre}</h2>
              <p className="text-blue-200 text-sm">{employee.store} · <span className="capitalize">{employee.rol}</span></p>
              <p className="text-blue-200 text-sm mt-1">{MESES[mes-1]} {ano}</p>
            </div>
            <button onClick={downloadPDF}
              className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-50 transition">
              Descargar Nómina PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Horas Normales', value: formatHoras(calc.horasNormales), color: 'text-blue-600' },
            { label: 'Horas Extras', value: formatHoras(calc.horasExtras), color: 'text-orange-600' },
            { label: 'Horas Festivas', value: formatHoras(calc.horasFestivas), color: 'text-purple-600' },
            { label: 'Asistencia', value: `${pct}%`, color: pct >= 90 ? 'text-green-600' : 'text-red-500' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl shadow p-4 text-center">
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Calendario {MESES[mes-1]}</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
              <div key={d} className="text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              const fecha = `${ano}-${String(mes).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const ts = timesheets.find(t => t.fecha === fecha);
              let horasHoy = 0;
              if (ts?.check_in_time && ts?.check_out_time) {
                horasHoy = calculateDailyHours(new Date(ts.check_in_time), new Date(ts.check_out_time)).totalHoras;
              }
              return (
                <div key={day} className={`rounded-lg p-1 text-center ${dayColors[status]}`} title={
                  ts?.check_in_time ? `${format(new Date(ts.check_in_time),'HH:mm')} - ${ts.check_out_time ? format(new Date(ts.check_out_time),'HH:mm') : '?'} (${formatHoras(horasHoy)})` : status
                }>
                  <div className="text-xs font-bold">{day}</div>
                  <div className="text-xs opacity-80">{dayLabels[status]}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 rounded bg-green-500 mr-1" />Presente</span>
            <span><span className="inline-block w-3 h-3 rounded bg-red-400 mr-1" />Ausente</span>
            <span><span className="inline-block w-3 h-3 rounded bg-gray-200 mr-1" />Descanso</span>
            <span><span className="inline-block w-3 h-3 rounded bg-purple-400 mr-1" />Festivo</span>
          </div>
        </div>

        {timesheets.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Registro diario</h3>
            <div className="space-y-2">
              {timesheets
                .filter(t => t.check_in_time)
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
                .map(ts => {
                  const dayHoras = ts.check_out_time
                    ? calculateDailyHours(new Date(ts.check_in_time!), new Date(ts.check_out_time)).totalHoras
                    : null;
                  return (
                    <div key={ts.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                      <span className="text-gray-600 capitalize">
                        {format(new Date(ts.fecha + 'T00:00:00'), "EEEE d", { locale: es })}
                      </span>
                      <span className="text-gray-500">
                        {format(new Date(ts.check_in_time!), 'HH:mm')}
                        {ts.check_out_time && ` → ${format(new Date(ts.check_out_time), 'HH:mm')}`}
                      </span>
                      <span className="font-medium text-blue-600">
                        {dayHoras !== null ? formatHoras(dayHoras) : 'En curso'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
