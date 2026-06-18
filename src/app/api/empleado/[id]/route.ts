import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mes = req.nextUrl.searchParams.get('mes') || String(new Date().getMonth() + 1);
  const ano = req.nextUrl.searchParams.get('ano') || String(new Date().getFullYear());

  const m = String(mes).padStart(2, '0');
  const daysInMonth = new Date(Number(ano), Number(mes), 0).getDate();
  const firstDay = `${ano}-${m}-01`;
  const lastDay = `${ano}-${m}-${String(daysInMonth).padStart(2, '0')}`;

  const [{ data: emp }, { data: ts }, { data: sch }, { data: sales }] = await Promise.all([
    adminSupabase.from('employees').select('*').eq('id', id).single(),
    adminSupabase.from('timesheets').select('*').eq('employee_id', id).gte('fecha', firstDay).lte('fecha', lastDay),
    adminSupabase.from('schedules').select('*').eq('employee_id', id).gte('fecha', firstDay).lte('fecha', lastDay),
    adminSupabase.from('sales').select('*').eq('employee_id', id).gte('fecha', firstDay).lte('fecha', lastDay),
  ]);

  if (!emp) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
  return NextResponse.json({ employee: emp, timesheets: ts || [], schedules: sch || [], sales: sales || [] });
}
