'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const role = session.user.app_metadata?.role;
        router.push(role === 'admin' ? '/dashboard' : '/checkin');
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    // Also check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user.app_metadata?.role;
        router.push(role === 'admin' ? '/dashboard' : '/checkin');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">Iniciando sesión...</p>
      </div>
    </div>
  );
}
