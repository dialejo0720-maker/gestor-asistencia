'use client';
import AdminLayout from '@/components/Layout/AdminLayout';
import ScheduleUploader from '@/components/Upload/ScheduleUploader';

export default function SchedulesPage() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
          <p className="text-gray-500 text-sm mt-0.5">Carga el horario mensual de todos los empleados</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <ScheduleUploader />
        </div>
      </div>
    </AdminLayout>
  );
}
