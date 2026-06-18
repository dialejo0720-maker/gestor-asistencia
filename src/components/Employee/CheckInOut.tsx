'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Employee, Timesheet, Sale } from '@/lib/types';
import { calculateDailyHours, formatHoras } from '@/lib/calculateHours';

interface Props {
  employee: Employee;
}

export default function CheckInOut({ employee }: Props) {
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDesc, setSaleDesc] = useState('');
  const [savingSale, setSavingSale] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);

  useEffect(() => {
    fetchToday();
    getLocation();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchToday() {
    const res = await fetch(`/api/checkin?email=${encodeURIComponent(employee.email)}`);
    if (res.ok) {
      const json = await res.json();
      setTimesheet(json.timesheet);
      setTodaySales(json.sales || []);
    }
  }

  async function getLocation() {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          address = data.display_name?.split(',').slice(0, 3).join(',') || address;
        } catch {}
        setLocation({ lat, lng, address });
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { timeout: 10000 }
    );
  }

  async function handleCheckIn() {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkin',
        employee_id: employee.id,
        location: { ...location, store: employee.store },
      }),
    });
    const json = await res.json();
    if (json.error) setMessage('Error al registrar entrada: ' + json.error);
    else { setMessage('¡Entrada registrada!'); setTimesheet(json.timesheet); }
    setLoading(false);
  }

  async function handleCheckOut() {
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkout',
        employee_id: employee.id,
        location,
      }),
    });
    const json = await res.json();
    if (json.error) setMessage('Error al registrar salida: ' + json.error);
    else { setMessage('¡Salida registrada!'); setTimesheet(json.timesheet); }
    setLoading(false);
  }

  async function handleAddSale() {
    if (!saleAmount || Number(saleAmount) <= 0) return;
    setSavingSale(true);
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sale',
        employee_id: employee.id,
        sale: { monto: Number(saleAmount), descripcion: saleDesc, store: employee.store },
      }),
    });
    const json = await res.json();
    if (!json.error) {
      setSaleAmount('');
      setSaleDesc('');
      setShowSaleForm(false);
      await fetchToday();
    }
    setSavingSale(false);
  }

  const hasCheckedIn = !!timesheet?.check_in_time;
  const hasCheckedOut = !!timesheet?.check_out_time;
  const totalVentas = todaySales.reduce((a, s) => a + s.monto, 0);

  let horasHoy = 0;
  if (timesheet?.check_in_time && timesheet?.check_out_time) {
    horasHoy = calculateDailyHours(new Date(timesheet.check_in_time), new Date(timesheet.check_out_time)).totalHoras;
  } else if (timesheet?.check_in_time) {
    horasHoy = Math.max(0, calculateDailyHours(new Date(timesheet.check_in_time), now).totalHoras);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-4 pt-8 pb-14">
        <p className="text-blue-200 text-sm capitalize">
          {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <p className="text-4xl font-bold mt-1 font-mono">{format(now, 'HH:mm:ss')}</p>
        <div className="mt-4">
          <p className="font-bold text-xl">{employee.nombre}</p>
          <p className="text-blue-200 text-sm">{employee.store} · <span className="capitalize">{employee.rol}</span></p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4 pb-8">
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          {message && (
            <div className={`text-center text-sm px-3 py-2 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>📍</span>
            <span className="truncate">
              {gettingLocation ? 'Obteniendo ubicación...' : location ? location.address : 'Ubicación no disponible'}
            </span>
            {!location && !gettingLocation && (
              <button onClick={getLocation} className="text-blue-500 underline ml-auto shrink-0">Reintentar</button>
            )}
          </div>

          <button onClick={handleCheckIn} disabled={loading || hasCheckedIn}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition active:scale-95 ${
              hasCheckedIn ? 'bg-green-100 text-green-600 cursor-default' : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200'
            }`}>
            {hasCheckedIn ? `✓ Entrada: ${format(new Date(timesheet!.check_in_time!), 'HH:mm')}` : '▶ MARCAR ENTRADA'}
          </button>

          <button onClick={handleCheckOut} disabled={loading || !hasCheckedIn || hasCheckedOut}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition active:scale-95 ${
              hasCheckedOut ? 'bg-blue-100 text-blue-600 cursor-default' :
              !hasCheckedIn ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
              'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
            }`}>
            {hasCheckedOut ? `✓ Salida: ${format(new Date(timesheet!.check_out_time!), 'HH:mm')}` : '■ MARCAR SALIDA'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{formatHoras(horasHoy)}</p>
            <p className="text-xs text-gray-400 mt-1">Horas hoy (−1h almuerzo)</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">${totalVentas.toLocaleString('es-CO')}</p>
            <p className="text-xs text-gray-400 mt-1">Ventas hoy</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Ventas del día</h3>
            <button onClick={() => setShowSaleForm(!showSaleForm)}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg">
              + Agregar
            </button>
          </div>

          {showSaleForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Monto ($)</label>
                <input type="number" value={saleAmount} onChange={e => setSaleAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Descripción (opcional)</label>
                <input type="text" value={saleDesc} onChange={e => setSaleDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Producto vendido..." />
              </div>
              <button onClick={handleAddSale} disabled={savingSale}
                className="w-full bg-green-500 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {savingSale ? 'Guardando...' : 'Guardar venta'}
              </button>
            </div>
          )}

          {todaySales.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No hay ventas registradas hoy</p>
          ) : (
            <div className="space-y-2">
              {todaySales.map(sale => (
                <div key={sale.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-gray-600">{sale.descripcion || 'Venta'}</span>
                  <span className="font-semibold text-green-600">${sale.monto.toLocaleString('es-CO')}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-bold">
                <span className="text-gray-700">Total</span>
                <span className="text-green-600">${totalVentas.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}
        </div>

        {hasCheckedIn && (
          <a href={`https://wa.me/?text=${encodeURIComponent(
            `📊 *Reporte ${employee.nombre}*\n📅 ${format(now, "d 'de' MMMM", { locale: es })}\n\n⏰ Entrada: ${timesheet?.check_in_time ? format(new Date(timesheet.check_in_time), 'HH:mm') : '-'}\n🏁 Salida: ${timesheet?.check_out_time ? format(new Date(timesheet.check_out_time), 'HH:mm') : 'En curso'}\n⏱ Horas: ${formatHoras(horasHoy)}\n💰 Ventas: $${totalVentas.toLocaleString('es-CO')}\n📍 ${employee.store}`
          )}`}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-2xl font-medium transition">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartir por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
