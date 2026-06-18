'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/lib/types';

const ROLES = ['vendedor', 'supervisor', 'gerente', 'admin'];
const empty = { nombre: '', email: '', telefono: '', store: '', rol: 'vendedor', salario_diario: 30000, activo: true };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/employees');
    const json = await res.json();
    setEmployees((json.employees || []) as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function openNew() {
    setForm(empty);
    setEditingId(null);
    setShowForm(true);
    setMsg('');
  }

  function openEdit(emp: Employee) {
    setForm({ nombre: emp.nombre, email: emp.email, telefono: emp.telefono || '', store: emp.store, rol: emp.rol, salario_diario: emp.salario_diario || 30000, activo: emp.activo });
    setEditingId(emp.id);
    setShowForm(true);
    setMsg('');
  }

  async function handleSave() {
    if (!form.nombre || !form.email || !form.store) { setMsg('Nombre, email y tienda son obligatorios'); return; }
    setSaving(true);
    setMsg('');

    if (editingId) {
      const res = await fetch(`/api/employees/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) setMsg('Error: ' + json.error);
      else { setMsg('✓ Empleado actualizado'); fetchEmployees(); }
    } else {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.error) { setMsg('Error: ' + json.error); setSaving(false); return; }
      setMsg('✓ Empleado creado exitosamente');
      fetchEmployees();
    }
    setSaving(false);
  }

  async function toggleActivo(emp: Employee) {
    await fetch(`/api/employees/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !emp.activo }),
    });
    fetchEmployees();
  }

  function shareWhatsApp(emp: Employee) {
    const text = `Hola ${emp.nombre.split(' ')[0]} 👋\n\nAcceso al sistema de asistencia:\n🔗 ${window.location.origin}/checkin\n\n1. Abre el enlace\n2. Ingresa tu email: ${emp.email}\n3. Marca tu entrada y salida diariamente\n\n📍 Tienda: ${emp.store}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  const filtered = employees.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.store.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );
  const stores = [...new Set(employees.map(e => e.store))];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
            <p className="text-gray-500 text-sm mt-0.5">{employees.filter(e => e.activo).length} activos · {employees.length} total</p>
          </div>
          <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
            + Agregar empleado
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stores.slice(0, 4).map(s => (
            <div key={s} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{employees.filter(e => e.store === s && e.activo).length}</p>
              <p className="text-xs text-gray-400 mt-0.5">empleados</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empleado..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Empleado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => (
                    <tr key={emp.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">{emp.nombre.charAt(0)}</div>
                          <div>
                            <div className="font-medium text-gray-900">{emp.nombre}</div>
                            <div className="text-xs text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{emp.store}</td>
                      <td className="px-4 py-3"><span className="capitalize text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{emp.rol}</span></td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActivo(emp)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${emp.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {emp.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(emp)} className="text-blue-600 hover:text-blue-800 text-xs font-medium underline">Editar</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => shareWhatsApp(emp)} className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Enviar acceso
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No hay empleados</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 text-sm mb-1">¿Cómo acceden los empleados?</h3>
          <p className="text-blue-700 text-xs">
            1. Crea el empleado aquí con su email.<br/>
            2. Usa <strong>"Enviar acceso"</strong> por WhatsApp con el link directo.<br/>
            3. El empleado entra a <strong>/checkin</strong>, escribe su email y ya puede marcar entrada/salida.
          </p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">{editingId ? 'Editar empleado' : 'Nuevo empleado'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nombre completo *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Juan García" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="juan@empresa.com" />
                  <p className="text-xs text-gray-500 mt-1">El empleado usará este email para entrar al check-in</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tienda *</label>
                  <input value={form.store} onChange={e => setForm({...form, store: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Centro, Norte..." />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="300 000 0000" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Rol</label>
                  <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none capitalize">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Salario diario ($)</label>
                  <input type="number" value={form.salario_diario} onChange={e => setForm({...form, salario_diario: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              {msg && <div className={`text-sm px-4 py-3 rounded-lg ${msg.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{msg}</div>}
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
