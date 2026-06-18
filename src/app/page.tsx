'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      supabase
        .from('users_admin')
        .select('rol')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          router.push(data ? '/dashboard' : '/checkin');
        });
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">Cargando...</p>
      </div>
    </div>
  );
}
