'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Employee, Timesheet, Schedule } from '@/lib/types';
import { calculateMonthlyHours, formatHoras } from '@/lib/calculateHours';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Summary = ReturnType<typeof calculateMonthlyHours> & { entrada_hoy?: string; salida_hoy?: string };

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function AttendanceTable() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [filterTienda, setFilterTienda] = useState('');
  const [search, setSearch] = useState('');
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const empRes = await fetch('/api/employees');
    const { employees: emps = [] } = await empRes.json();
    const active = emps.filter((e: Employee) => e.activo);
    setEmployees(active);

    const firstDay = `${selectedAno}-${String(selectedMes).padStart(2,'0')}-01`;
    const lastDay = format(new Date(selectedAno, selectedMes, 0), 'yyyy-MM-dd');

    const [{ data: timesheets }, { data: schedules }] = await Promise.all([
      supabase.from('timesheets').select('*').in('employee_id', active.map((e: Employee) => e.id)).gte('fecha', firstDay).lte('fecha', lastDay),
      supabase.from('schedules').select('*').in('employee_id', active.map((e: Employee) => e.id)).gte('fecha', firstDay).lte('fecha', lastDay),
    ]);

    const newSummaries: Record<string, Summary> = {};
    for (const emp of active) {
      const empTS = (timesheets || []).filter((t: Timesheet) => t.employee_id === emp.id);
      const empSch = (schedules || []).filter((s: Schedule) => s.employee_id === emp.id);
      const monthly = calculateMonthlyHours(empTS, empSch);
      const todayTS = empTS.find((t: Timesheet) => t.fecha === today);
      newSummaries[emp.id] = {
        ...monthly,
        entrada_hoy: todayTS?.check_in_time ? format(new Date(todayTS.check_in_time), 'HH:mm') : undefined,
        salida_hoy: todayTS?.check_out_time ? format(new Date(todayTS.check_out_time), 'HH:mm') : undefined,
      };
    }
    setSummaries(newSummaries);
    setLoading(false);
  }, [selectedMes, selectedAno, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tiendas = [...new Set(employees.map(e => e.store))];
  const filtered = employees.filter(e => {
    const matchTienda = !filterTienda || e.store === filterTienda;
    const matchSearch = !search || e.nombre.toLowerCase().includes(search.toLowerCase());
    return matchTienda && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-2 lg:flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Mes</label>
            <select value={selectedMes} onChange={e => setSelectedMes(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Año</label>
            <select value={selectedAno} onChange={e => setSelectedAno(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tienda</label>
            <select value={filterTienda} onChange={e => setFilterTienda(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Todas</option>
              {tiendas.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2 lg:flex-1">
            <label className="text-xs text-gray-500 block mb-1">Buscar</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={fetchData} className="col-span-2 lg:col-span-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm">Cargando datos...</div>
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="lg:hidden space-y-3">
            {filtered.map(emp => {
              const s = summaries[emp.id];
              const isPresent = !!s?.entrada_hoy;
              return (
                <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.nombre.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{emp.nombre}</div>
                        <div className="text-xs text-gray-400">{emp.store}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isPresent ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-semibold text-gray-900">{s?.entrada_hoy || '—'}</div>
                      <div className="text-gray-400">Entrada</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-semibold text-gray-900">{s?.salida_hoy || (isPresent ? 'En tienda' : '—')}</div>
                      <div className="text-gray-400">Salida</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-semibold text-gray-900">{s ? formatHoras(s.horasNormales + s.horasExtras) : '0h'}</div>
                      <div className="text-gray-400">Horas mes</div>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/empleado/${emp.id}?mes=${selectedMes}&ano=${selectedAno}`)}
                    className="w-full text-center text-blue-600 text-xs font-medium py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                    Ver detalle →
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-8 text-gray-400 bg-white rounded-xl">No hay empleados</div>}
          </div>

          {/* Desktop: table view */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Empleado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tienda</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Entrada Hoy</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Salida Hoy</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Horas Mes</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Extras</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Asistencia</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, idx) => {
                    const s = summaries[emp.id];
                    const total = s ? s.diasTrabajados + s.diasAusentes : 0;
                    const pct = total > 0 ? Math.round((s.diasTrabajados / total) * 100) : 0;
                    return (
                      <tr key={emp.id} className={`border-b last:border-0 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{emp.nombre}</div>
                          <div className="text-xs text-gray-400 capitalize">{emp.rol}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{emp.store}</td>
                        <td className="px-4 py-3 text-center">
                          {s?.entrada_hoy ? <span className="text-green-600 font-medium">{s.entrada_hoy} ✓</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s?.salida_hoy ? <span className="text-blue-600 font-medium">{s.salida_hoy} ✓</span>
                            : s?.entrada_hoy ? <span className="text-yellow-500 text-xs">En tienda</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                          {s ? formatHoras(s.horasNormales + s.horasExtras + s.horasFestivas) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s?.horasExtras ? <span className="text-orange-600 font-medium">{formatHoras(s.horasExtras)}</span> : '0h'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${pct >= 90 ? 'bg-green-100 text-green-700' : pct >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => router.push(`/empleado/${emp.id}?mes=${selectedMes}&ano=${selectedAno}`)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline">
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay empleados</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
