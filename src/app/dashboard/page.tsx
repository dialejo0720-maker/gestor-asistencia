'use client';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/Layout/AdminLayout';
import AttendanceTable from '@/components/Dashboard/AttendanceTable';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, presentes: 0, ausentes: 0, tiendas: 0 });

  const fetchStats = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: emps } = await supabase.from('employees').select('id, store').eq('activo', true);
    const { data: ts } = await supabase.from('timesheets').select('employee_id').eq('fecha', today).not('check_in_time', 'is', null);
    const empIds = (emps || []).map(e => e.id);
    const presentIds = new Set((ts || []).map(t => t.employee_id));
    const presentes = empIds.filter(id => presentIds.has(id)).length;
    const tiendas = new Set((emps || []).map(e => e.store)).size;
    setStats({ total: empIds.length, presentes, ausentes: empIds.length - presentes, tiendas });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const hoy = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm capitalize mt-0.5">{hoy}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Total empleados</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.tiendas} tiendas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Presentes hoy</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.presentes}</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0}% asistencia
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Sin marcar</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{stats.ausentes}</p>
            <p className="text-xs text-gray-400 mt-1">No han marcado entrada</p>
          </div>
          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-200 text-sm">Link check-in</span>
              <span className="text-2xl">📱</span>
            </div>
            <p className="text-sm font-mono font-medium">/checkin</p>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.origin + '/checkin')}
              className="mt-2 text-xs bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded-lg w-full transition"
            >
              Copiar enlace
            </button>
          </div>
        </div>

        {/* Table */}
        <AttendanceTable />
      </div>
    </AdminLayout>
  );
}
