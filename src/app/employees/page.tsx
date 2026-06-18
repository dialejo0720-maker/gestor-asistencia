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
    const { data } = await supabase.from('employees').select('*').order('nombre');
    setEmployees((data || []) as Employee[]);
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
    setForm({
      nombre: emp.nombre,
      email: emp.email,
      telefono: emp.telefono || '',
      store: emp.store,
      rol: emp.rol,
      salario_diario: emp.salario_diario || 30000,
      activo: emp.activo,
    });
    setEditingId(emp.id);
    setShowForm(true);
    setMsg('');
  }

  async function handleSave() {
    if (!form.nombre || !form.email || !form.store) {
      setMsg('Nombre, email y tienda son obligatorios');
      return;
    }
    setSaving(true);
    setMsg('');

    if (editingId) {
      const { error } = await supabase.from('employees').update({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        store: form.store,
        rol: form.rol,
        salario_diario: form.salario_diario,
        activo: form.activo,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId);
      if (error) setMsg('Error: ' + error.message);
      else { setMsg('Empleado actualizado'); setShowForm(false); fetchEmployees(); }
    } else {
      const { error } = await supabase.from('employees').insert({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        store: form.store,
        rol: form.rol,
        salario_diario: form.salario_diario,
        activo: form.activo,
      });
      if (error) setMsg('Error: ' + error.message);
      else { setMsg('Empleado creado'); setShowForm(false); fetchEmployees(); }
    }
    setSaving(false);
  }

  async function toggleActivo(emp: Employee) {
    await supabase.from('employees').update({ activo: !emp.activo }).eq('id', emp.id);
    fetchEmployees();
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
          <button onClick={openNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            + Agregar empleado
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stores.slice(0, 4).map(s => (
            <div key={s} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {employees.filter(e => e.store === s && e.activo).length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">empleados</p>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, tienda o email..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Empleado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Salario/Día</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => (
                    <tr key={emp.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {emp.nombre.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{emp.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{emp.store}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{emp.rol}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{emp.email}</td>
                      <td className="px-4 py-3 text-center text-gray-600">${(emp.salario_diario || 0).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActivo(emp)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            emp.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                          {emp.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => openEdit(emp)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium underline">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No hay empleados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">{editingId ? 'Editar empleado' : 'Nuevo empleado'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Nombre completo *</label>
                  <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Juan García" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="juan@empresa.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Tienda / Punto de venta *</label>
                  <input value={form.store} onChange={e => setForm({...form, store: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Centro, Norte..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="300 000 0000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Rol</label>
                  <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none capitalize">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Salario diario ($)</label>
                  <input type="number" value={form.salario_diario} onChange={e => setForm({...form, salario_diario: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              {msg && (
                <div className={`text-sm px-4 py-3 rounded-lg ${msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {msg}
                </div>
              )}
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
