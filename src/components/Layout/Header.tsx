'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title = 'Gestor Asistencia', showBack }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white text-sm"
            >
              ← Volver
            </button>
          )}
          <h1 className="font-bold text-lg">{title}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
