import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const mes = req.nextUrl.searchParams.get('mes');
  const ano = req.nextUrl.searchParams.get('ano');

  if (!mes || !ano) return NextResponse.json({ error: 'mes y ano requeridos' }, { status: 400 });

  const firstDay = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const lastDayDate = new Date(Number(ano), Number(mes), 0);
  const lastDay = lastDayDate.toISOString().slice(0, 10);

  const [{ data: timesheets, error: tsErr }, { data: schedules, error: schErr }] = await Promise.all([
    adminSupabase.from('timesheets').select('*').gte('fecha', firstDay).lte('fecha', lastDay),
    adminSupabase.from('schedules').select('*').gte('fecha', firstDay).lte('fecha', lastDay),
  ]);

  if (tsErr) return NextResponse.json({ error: tsErr.message }, { status: 500 });
  if (schErr) return NextResponse.json({ error: schErr.message }, { status: 500 });

  return NextResponse.json({ timesheets: timesheets || [], schedules: schedules || [] });
}
