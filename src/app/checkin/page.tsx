'use client';
import { useState } from 'react';
import { Employee } from '@/lib/types';
import CheckInOut from '@/components/Employee/CheckInOut';

export default function CheckInPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch(`/api/checkin?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    const json = await res.json();

    if (!res.ok || json.error || !json.employee) {
      setError('No se encontró ningún empleado con ese email. Verifica con tu administrador.');
    } else {
      setEmployee(json.employee as Employee);
    }
    setLoading(false);
  }

  if (employee) return <CheckInOut employee={employee} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">⏱</div>
          <h1 className="text-white text-2xl font-bold">Check-in Empleados</h1>
          <p className="text-blue-200 text-sm mt-1">Ingresa tu email para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Tu email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="tu@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleLookup}
            disabled={loading || !email.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Ingresar →'}
          </button>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          ¿Problemas? Contacta a tu administrador
        </p>
      </div>
    </div>
  );
}
