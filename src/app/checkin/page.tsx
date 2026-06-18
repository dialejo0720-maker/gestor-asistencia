'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/lib/types';
import CheckInOut from '@/components/Employee/CheckInOut';

export default function CheckInPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (!emp) { router.push('/login'); return; }
      setEmployee(emp);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) return null;
  return <CheckInOut employee={employee} />;
}
