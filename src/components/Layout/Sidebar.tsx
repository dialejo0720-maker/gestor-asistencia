'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/employees', label: 'Empleados', icon: '👥' },
  { href: '/sales', label: 'Ventas Diarias', icon: '💵' },
  { href: '/schedules', label: 'Horarios', icon: '📅' },
  { href: '/payroll', label: 'Nómina', icon: '💰' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    router.push('/login');
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center text-lg">⏱</div>
          <div>
            <p className="font-bold text-sm leading-tight">Gestor</p>
            <p className="text-gray-400 text-xs">Asistencia & Nómina</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-gray-700 mt-4">
          <p className="text-xs text-gray-500 px-3 mb-2 uppercase tracking-wider">Link empleados</p>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">URL de check-in:</p>
            <code className="text-xs text-blue-400 break-all">/checkin</code>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.origin + '/checkin')}
              className="mt-2 w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded-md transition"
            >
              Copiar link
            </button>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
