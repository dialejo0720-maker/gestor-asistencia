'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, getDaysInMonth, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/Layout/AdminLayout';
import { Employee, Timesheet, Schedule } from '@/lib/types';
import { calculateMonthlyHours, calculateDailyHours, formatHoras } from '@/lib/calculateHours';
import { generatePayrollPDF } from '@/lib/generatePayroll';
import { isFestivo } from '@/lib/festivos';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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

export default function EmployeeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const [mes, setMes] = useState(Number(searchParams.get('mes') || new Date().getMonth() + 1));
  const [ano, setAno] = useState(Number(searchParams.get('ano') || new Date().getFullYear()));

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/empleado/${id}?mes=${mes}&ano=${ano}`);
    if (!res.ok) { router.push('/dashboard'); return; }
    const json = await res.json();
    setEmployee(json.employee);
    setTimesheets(json.timesheets);
    setSchedules(json.schedules);
    setLoading(false);
  }, [id, mes, ano, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function downloadPDF() {
    if (!employee) return;
    const calc = calculateMonthlyHours(timesheets, schedules);
    const doc = generatePayrollPDF(employee, calc, mes, ano);
    doc.save(`nomina_${employee.nombre.replace(/\s/g,'_')}_${MESES[mes-1]}_${ano}.pdf`);
  }

  function shareWhatsApp() {
    if (!employee) return;
    const calc = calculateMonthlyHours(timesheets, schedules);
    const pct = (calc.diasTrabajados + calc.diasAusentes) > 0
      ? Math.round((calc.diasTrabajados / (calc.diasTrabajados + calc.diasAusentes)) * 100) : 0;
    const text = `📊 *Nómina ${employee.nombre}*\n📅 ${MESES[mes-1]} ${ano}\n\n⏱ Horas normales: ${formatHoras(calc.horasNormales)}\n⚡ Horas extras: ${formatHoras(calc.horasExtras)}\n🎉 Horas festivas: ${formatHoras(calc.horasFestivas)}\n📅 Días trabajados: ${calc.diasTrabajados}\n✅ Asistencia: ${pct}%\n📍 Tienda: ${employee.store}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function getDayStatus(day: number) {
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

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  if (!employee) return null;

  const calc = calculateMonthlyHours(timesheets, schedules);
  const totalDias = calc.diasTrabajados + calc.diasAusentes;
  const pct = totalDias > 0 ? Math.round((calc.diasTrabajados / totalDias) * 100) : 0;
  const daysInMonth = getDaysInMonth(new Date(ano, mes - 1));
  const firstDayOfMonth = new Date(ano, mes - 1, 1).getDay();

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white rounded-2xl p-5">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <button onClick={() => router.back()} className="text-blue-200 text-sm mb-2 flex items-center gap-1 hover:text-white">
                ← Volver
              </button>
              <h2 className="text-xl font-bold">{employee.nombre}</h2>
              <p className="text-blue-200 text-sm">{employee.store} · <span className="capitalize">{employee.rol}</span></p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={shareWhatsApp}
                className="bg-green-500 hover:bg-green-400 text-white font-semibold px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Compartir
              </button>
              <button onClick={downloadPDF}
                className="bg-white text-blue-600 font-semibold px-3 py-2 rounded-xl text-sm hover:bg-blue-50 transition">
                Descargar PDF
              </button>
            </div>
          </div>

          {/* Month selector */}
          <div className="flex gap-2 mt-4">
            <select value={mes} onChange={e => setMes(Number(e.target.value))}
              className="bg-blue-500 text-white border-0 rounded-lg px-3 py-1.5 text-sm outline-none">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={ano} onChange={e => setAno(Number(e.target.value))}
              className="bg-blue-500 text-white border-0 rounded-lg px-3 py-1.5 text-sm outline-none">
              {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Horas Normales', value: formatHoras(calc.horasNormales), color: 'text-blue-600' },
            { label: 'Horas Extras', value: formatHoras(calc.horasExtras), color: 'text-orange-600' },
            { label: 'Horas Festivas', value: formatHoras(calc.horasFestivas), color: 'text-purple-600' },
            { label: 'Asistencia', value: `${pct}%`, color: pct >= 90 ? 'text-green-600' : 'text-red-500' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Calendario {MESES[mes-1]} {ano}</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
              <div key={d} className="text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
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
                <div key={day} className={`rounded-lg p-1 text-center ${dayColors[status]}`}
                  title={ts?.check_in_time ? `${format(new Date(ts.check_in_time),'HH:mm')}${ts.check_out_time ? ` - ${format(new Date(ts.check_out_time),'HH:mm')}` : ''} (${formatHoras(horasHoy)})` : status}>
                  <div className="text-xs font-bold">{day}</div>
                  <div className="text-xs opacity-80">{dayLabels[status]}</div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 rounded bg-green-500 mr-1" />Presente</span>
            <span><span className="inline-block w-3 h-3 rounded bg-red-400 mr-1" />Ausente</span>
            <span><span className="inline-block w-3 h-3 rounded bg-gray-200 mr-1" />Descanso</span>
            <span><span className="inline-block w-3 h-3 rounded bg-purple-400 mr-1" />Festivo</span>
          </div>
        </div>

        {/* Daily log */}
        {timesheets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
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
                      <span className="text-gray-500 text-xs">
                        {format(new Date(ts.check_in_time!), 'HH:mm')}
                        {ts.check_out_time && ` → ${format(new Date(ts.check_out_time), 'HH:mm')}`}
                      </span>
                      <span className="font-medium text-blue-600 text-xs">
                        {dayHoras !== null ? formatHoras(dayHoras) : 'En curso'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
