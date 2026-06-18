'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Employee, Timesheet, Schedule } from '@/lib/types';
import { calculateMonthlyHours, formatHoras } from '@/lib/calculateHours';
import { useRouter } from 'next/navigation';

export default function AttendanceTable() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [filterTienda, setFilterTienda] = useState('');
  const [search, setSearch] = useState('');
  const [summaries, setSummaries] = useState<Record<string, ReturnType<typeof calculateMonthlyHours> & { entrada_hoy?: string; salida_hoy?: string }>>({});

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: emps } = await supabase
      .from('employees')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (!emps) { setLoading(false); return; }
    setEmployees(emps);

    const firstDay = `${selectedAno}-${String(selectedMes).padStart(2,'0')}-01`;
    const lastDay = new Date(selectedAno, selectedMes, 0);
    const lastDayStr = format(lastDay, 'yyyy-MM-dd');

    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('*')
      .in('employee_id', emps.map(e => e.id))
      .gte('fecha', firstDay)
      .lte('fecha', lastDayStr);

    const { data: schedules } = await supabase
      .from('schedules')
      .select('*')
      .in('employee_id', emps.map(e => e.id))
      .gte('fecha', firstDay)
      .lte('fecha', lastDayStr);

    const newSummaries: typeof summaries = {};
    for (const emp of emps) {
      const empTimesheets = (timesheets || []).filter(t => t.employee_id === emp.id) as Timesheet[];
      const empSchedules = (schedules || []).filter(s => s.employee_id === emp.id) as Schedule[];
      const monthly = calculateMonthlyHours(empTimesheets, empSchedules);
      const todayTS = empTimesheets.find(t => t.fecha === today);
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

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Mes</label>
          <select
            value={selectedMes}
            onChange={e => setSelectedMes(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Año</label>
          <select
            value={selectedAno}
            onChange={e => setSelectedAno(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tienda</label>
          <select
            value={filterTienda}
            onChange={e => setFilterTienda(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todas</option>
            {tiendas.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 block mb-1">Buscar empleado</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nombre..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando datos...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
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
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Festivos</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Asistencia</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => {
                  const s = summaries[emp.id];
                  const total = s ? s.diasTrabajados + s.diasAusentes : 0;
                  const pct = total > 0 ? Math.round((s?.diasTrabajados / total) * 100) : 0;
                  const isPresent = !!s?.entrada_hoy;

                  return (
                    <tr key={emp.id} className={`border-b last:border-0 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{emp.nombre}</div>
                        <div className="text-xs text-gray-400 capitalize">{emp.rol}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{emp.store}</td>
                      <td className="px-4 py-3 text-center">
                        {s?.entrada_hoy ? (
                          <span className="text-green-600 font-medium">{s.entrada_hoy} ✓</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s?.salida_hoy ? (
                          <span className="text-blue-600 font-medium">{s.salida_hoy} ✓</span>
                        ) : s?.entrada_hoy ? (
                          <span className="text-yellow-500 text-xs">En tienda</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {s ? formatHoras(s.horasNormales + s.horasExtras + s.horasFestivas) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s?.horasExtras ? (
                          <span className="text-orange-600 font-medium">{formatHoras(s.horasExtras)}</span>
                        ) : '0h'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s?.horasFestivas ? (
                          <span className="text-purple-600 font-medium">{formatHoras(s.horasFestivas)}</span>
                        ) : '0h'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          pct >= 90 ? 'bg-green-100 text-green-700' :
                          pct >= 70 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/empleado/${emp.id}?mes=${selectedMes}&ano=${selectedAno}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">
                      No hay empleados para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
