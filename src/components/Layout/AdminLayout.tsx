'use client';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setReady(true); }, []);

  if (!ready) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-64">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-h-screen pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-sm">⏱</div>
            <span className="font-bold text-gray-900 text-sm">Gestor Asistencia</span>
          </div>
          <div className="w-10" />
        </div>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
