'use client';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminLayout from '@/components/Layout/AdminLayout';

interface SaleRow {
  id: string;
  monto: number;
  descripcion: string;
  fecha: string;
  store: string;
  employees: { nombre: string; store: string };
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sales?fecha=${selectedDate}`);
    const json = await res.json();
    setSales(json.sales || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const totalVentas = sales.reduce((a, s) => a + Number(s.monto), 0);
  const byStore = sales.reduce((acc, s) => {
    const store = s.employees?.store || s.store || 'Sin tienda';
    acc[store] = (acc[store] || 0) + Number(s.monto);
    return acc;
  }, {} as Record<string, number>);

  function shareWhatsApp() {
    const fecha = format(new Date(selectedDate + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es });
    const storeLines = Object.entries(byStore).map(([s, m]) => `  • ${s}: $${m.toLocaleString('es-CO')}`).join('\n');
    const text = `📊 *Reporte de Ventas*\n📅 ${fecha}\n\n${storeLines || '  • Sin ventas registradas'}\n\n💰 *TOTAL: $${totalVentas.toLocaleString('es-CO')}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  const fechaDisplay = format(new Date(selectedDate + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es });

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas Diarias</h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">{fechaDisplay}</p>
          </div>
          <div className="flex gap-2 items-center">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            <button onClick={shareWhatsApp}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Compartir
            </button>
            <button onClick={fetchSales} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
              ↻
            </button>
          </div>
        </div>

        {/* Totals by store */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-blue-600 text-white rounded-xl p-4">
            <p className="text-blue-200 text-xs">Total del día</p>
            <p className="text-2xl font-bold mt-1">${totalVentas.toLocaleString('es-CO')}</p>
            <p className="text-blue-200 text-xs mt-1">{sales.length} registros · {Object.keys(byStore).length} tiendas</p>
          </div>
          {Object.entries(byStore).map(([store, monto]) => (
            <div key={store} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 truncate font-medium">{store}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">${monto.toLocaleString('es-CO')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sales.filter(s => (s.employees?.store || s.store) === store).length} ventas</p>
            </div>
          ))}
        </div>

        {/* Sales table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 text-sm">Detalle por vendedor</h3>
            {sales.length > 0 && <span className="text-xs text-gray-400">{sales.length} registros</span>}
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando ventas...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">💵</div>
              <p className="font-medium text-gray-500">No hay ventas para esta fecha</p>
              <p className="text-xs text-gray-400 mt-1">Los empleados registran ventas desde /checkin</p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {sales.map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{s.employees?.nombre || '—'}</div>
                      <div className="text-xs text-gray-400">{s.employees?.store || s.store || '—'} · {s.descripcion || 'Venta'}</div>
                    </div>
                    <div className="font-bold text-green-600">${Number(s.monto).toLocaleString('es-CO')}</div>
                  </div>
                ))}
                <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
                  <span className="font-bold text-gray-700">TOTAL</span>
                  <span className="font-bold text-green-600 text-lg">${totalVentas.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Desktop: table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Empleado</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Descripción</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <tr key={s.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{s.employees?.nombre || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.employees?.store || s.store || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.descripcion || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">${Number(s.monto).toLocaleString('es-CO')}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                      <td colSpan={3} className="px-4 py-3 text-gray-700">TOTAL</td>
                      <td className="px-4 py-3 text-right text-green-600 text-base">${totalVentas.toLocaleString('es-CO')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>¿Cómo funciona?</strong> Los empleados registran sus ventas desde <strong>/checkin</strong> y aparecen aquí en tiempo real. Usa el botón <strong>↻</strong> para actualizar.
        </div>
      </div>
    </AdminLayout>
  );
}
