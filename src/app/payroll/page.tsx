'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Employee, Timesheet, Schedule } from '@/lib/types';
import { calculateMonthlyHours, formatHoras } from '@/lib/calculateHours';
import { generatePayrollPDF } from '@/lib/generatePayroll';
import * as XLSX from 'xlsx';

interface EmployeeSummary {
  employee: Employee;
  horasNormales: number;
  horasExtras: number;
  horasFestivas: number;
  diasTrabajados: number;
  diasAusentes: number;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PayrollPage() {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<EmployeeSummary[]>([]);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    const { data: emps } = await supabase.from('employees').select('*').eq('activo', true).order('nombre');
    if (!emps) { setLoading(false); return; }

    const firstDay = `${selectedAno}-${String(selectedMes).padStart(2,'0')}-01`;
    const lastDayDate = new Date(selectedAno, selectedMes, 0);
    const lastDayStr = `${selectedAno}-${String(selectedMes).padStart(2,'0')}-${String(lastDayDate.getDate()).padStart(2,'0')}`;

    const { data: timesheets } = await supabase.from('timesheets').select('*')
      .in('employee_id', emps.map(e => e.id)).gte('fecha', firstDay).lte('fecha', lastDayStr);
    const { data: schedules } = await supabase.from('schedules').select('*')
      .in('employee_id', emps.map(e => e.id)).gte('fecha', firstDay).lte('fecha', lastDayStr);

    const results: EmployeeSummary[] = emps.map(emp => {
      const empTS = (timesheets || []).filter(t => t.employee_id === emp.id) as Timesheet[];
      const empSch = (schedules || []).filter(s => s.employee_id === emp.id) as Schedule[];
      return { employee: emp, ...calculateMonthlyHours(empTS, empSch) };
    });

    setSummaries(results);
    setLoading(false);
  }, [selectedMes, selectedAno]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  function downloadPDF(s: EmployeeSummary) {
    setGenerating(s.employee.id);
    const doc = generatePayrollPDF(s.employee, s, selectedMes, selectedAno);
    doc.save(`nomina_${s.employee.nombre.replace(/\s/g,'_')}_${MESES[selectedMes-1]}_${selectedAno}.pdf`);
    setGenerating(null);
  }

  function exportExcel() {
    const rows = summaries.map(s => ({
      'Empleado': s.employee.nombre,
      'Tienda': s.employee.store,
      'Horas Normales': s.horasNormales.toFixed(2),
      'Horas Extras': s.horasExtras.toFixed(2),
      'Horas Festivas': s.horasFestivas.toFixed(2),
      'Total Horas': (s.horasNormales + s.horasExtras + s.horasFestivas).toFixed(2),
      'Días Trabajados': s.diasTrabajados,
      'Total Estimado': Math.round(((s.horasNormales * 1 + s.horasExtras * 1.25 + s.horasFestivas * 2) * ((s.employee.salario_diario || 30000) / 8)) * 0.92),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nómina');
    XLSX.writeFile(wb, `nomina_${MESES[selectedMes-1]}_${selectedAno}.xlsx`);
  }

  const totalPagar = summaries.reduce((acc, s) => {
    const vh = (s.employee.salario_diario || 30000) / 8;
    return acc + (s.horasNormales * vh + s.horasExtras * vh * 1.25 + s.horasFestivas * vh * 2) * 0.92;
  }, 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nómina</h1>
            <p className="text-gray-500 text-sm mt-0.5">Cálculo de horas y generación de reportes</p>
          </div>
          <button onClick={exportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            Exportar Excel
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Mes</label>
            <select value={selectedMes} onChange={e => setSelectedMes(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Año</label>
            <select value={selectedAno} onChange={e => setSelectedAno(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {[2025,2026,2027].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={fetchPayroll} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Calcular
          </button>
          {totalPagar > 0 && (
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">Total a pagar</p>
              <p className="text-xl font-bold text-green-600">${Math.round(totalPagar).toLocaleString('es-CO')}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Calculando nómina...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Empleado</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">H. Normales</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">H. Extras</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">H. Festivas</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Total Horas</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Días</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Neto estimado</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s, i) => {
                    const vh = (s.employee.salario_diario || 30000) / 8;
                    const total = (s.horasNormales * vh + s.horasExtras * vh * 1.25 + s.horasFestivas * vh * 2) * 0.92;
                    return (
                      <tr key={s.employee.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.employee.nombre}</div>
                          <div className="text-xs text-gray-400">{s.employee.store}</div>
                        </td>
                        <td className="px-4 py-3 text-center">{formatHoras(s.horasNormales)}</td>
                        <td className="px-4 py-3 text-center text-orange-600 font-medium">{formatHoras(s.horasExtras)}</td>
                        <td className="px-4 py-3 text-center text-purple-600 font-medium">{formatHoras(s.horasFestivas)}</td>
                        <td className="px-4 py-3 text-center font-medium">{formatHoras(s.horasNormales + s.horasExtras + s.horasFestivas)}</td>
                        <td className="px-4 py-3 text-center">{s.diasTrabajados}</td>
                        <td className="px-4 py-3 text-center font-bold text-green-600">${Math.round(total).toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => downloadPDF(s)} disabled={generating === s.employee.id}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50">
                            {generating === s.employee.id ? '...' : 'PDF'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {summaries.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">Sin datos para este período</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
