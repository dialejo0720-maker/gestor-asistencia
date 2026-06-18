'use client';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/Layout/AdminLayout';
import AttendanceTable from '@/components/Dashboard/AttendanceTable';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, presentes: 0, ausentes: 0, tiendas: 0 });

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/employees');
    const { employees = [] } = await res.json();
    const today = format(new Date(), 'yyyy-MM-dd');
    const tsRes = await fetch(`/api/dashboard/today?date=${today}`);
    const tsJson = await tsRes.json();
    const presentIds = new Set((tsJson.timesheets || []).map((t: { employee_id: string }) => t.employee_id));
    const activos = employees.filter((e: { activo: boolean }) => e.activo);
    const presentes = activos.filter((e: { id: string }) => presentIds.has(e.id)).length;
    const tiendas = new Set(activos.map((e: { store: string }) => e.store)).size;
    setStats({ total: activos.length, presentes, ausentes: activos.length - presentes, tiendas });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const hoy = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm capitalize mt-0.5">{hoy}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-400 text-xs mb-2">Total empleados</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.tiendas} tiendas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-400 text-xs mb-2">Presentes hoy</p>
            <p className="text-3xl font-bold text-green-600">{stats.presentes}</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0}% asistencia
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-400 text-xs mb-2">Sin marcar</p>
            <p className="text-3xl font-bold text-red-500">{stats.ausentes}</p>
            <p className="text-xs text-gray-400 mt-1">No han entrado</p>
          </div>
          <div className="bg-blue-600 rounded-xl p-4 text-white">
            <p className="text-blue-200 text-xs mb-2">Link empleados</p>
            <p className="text-sm font-mono font-medium mb-2">/checkin</p>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.origin + '/checkin')}
              className="text-xs bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg w-full transition"
            >
              Copiar enlace
            </button>
          </div>
        </div>

        <AttendanceTable />
      </div>
    </AdminLayout>
  );
}
