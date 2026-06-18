'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { Employee, Timesheet } from '@/lib/types';
import { calculateDailyHours, formatHoras } from '@/lib/calculateHours';

interface Props {
  employee: Employee;
}

export default function CheckInOut({ employee }: Props) {
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(new Date());

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchToday();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchToday() {
    const { data } = await supabase
      .from('timesheets')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('fecha', today)
      .single();
    setTimesheet(data);
  }

  async function handleCheckIn() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.from('timesheets').insert({
      employee_id: employee.id,
      fecha: today,
      check_in_time: new Date().toISOString(),
      ubicacion_texto: employee.store,
    });

    if (error) {
      setMessage('Error al registrar entrada. Intenta de nuevo.');
    } else {
      setMessage('¡Entrada registrada exitosamente!');
      fetchToday();
    }
    setLoading(false);
  }

  async function handleCheckOut() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase
      .from('timesheets')
      .update({ check_out_time: new Date().toISOString() })
      .eq('employee_id', employee.id)
      .eq('fecha', today);

    if (error) {
      setMessage('Error al registrar salida. Intenta de nuevo.');
    } else {
      setMessage('¡Salida registrada exitosamente!');
      fetchToday();
    }
    setLoading(false);
  }

  const hasCheckedIn = !!timesheet?.check_in_time;
  const hasCheckedOut = !!timesheet?.check_out_time;

  let horasHoy = 0;
  if (timesheet?.check_in_time && timesheet?.check_out_time) {
    const { totalHoras } = calculateDailyHours(
      new Date(timesheet.check_in_time),
      new Date(timesheet.check_out_time)
    );
    horasHoy = totalHoras;
  } else if (timesheet?.check_in_time) {
    const { totalHoras } = calculateDailyHours(
      new Date(timesheet.check_in_time),
      now
    );
    horasHoy = Math.max(0, totalHoras);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-blue-600 text-white px-4 pt-8 pb-12">
        <p className="text-blue-200 text-sm">
          {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
        <p className="text-4xl font-bold mt-1">{format(now, 'HH:mm:ss')}</p>
        <p className="mt-4 font-semibold text-lg">Bienvenido, {employee.nombre.split(' ')[0]}</p>
        <p className="text-blue-200 text-sm flex items-center gap-1 mt-1">
          <span>📍</span> {employee.store}
        </p>
      </div>

      <div className="flex-1 px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {message && (
            <div className={`text-center px-4 py-3 rounded-lg text-sm font-medium ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={loading || hasCheckedIn}
            className={`w-full py-5 rounded-2xl text-white font-bold text-xl transition ${
              hasCheckedIn
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 active:scale-95 shadow-lg shadow-green-200'
            }`}
          >
            {hasCheckedIn ? '✓ Entrada Registrada' : '▶ MARCAR ENTRADA'}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={loading || !hasCheckedIn || hasCheckedOut}
            className={`w-full py-5 rounded-2xl font-bold text-xl transition ${
              !hasCheckedIn || hasCheckedOut
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white active:scale-95 shadow-lg shadow-red-200'
            }`}
          >
            {hasCheckedOut ? '✓ Salida Registrada' : '■ MARCAR SALIDA'}
          </button>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow p-5 space-y-3">
          <h3 className="font-semibold text-gray-700">Resumen de hoy</h3>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">Entrada</span>
            <span className="font-medium">
              {timesheet?.check_in_time
                ? format(new Date(timesheet.check_in_time), 'HH:mm')
                : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">Salida</span>
            <span className="font-medium">
              {timesheet?.check_out_time
                ? format(new Date(timesheet.check_out_time), 'HH:mm')
                : hasCheckedIn ? 'En curso...' : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500 text-sm">Horas trabajadas (−1h almuerzo)</span>
            <span className="font-bold text-blue-600">{formatHoras(horasHoy)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
