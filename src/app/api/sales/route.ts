import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get('fecha') || new Date().toISOString().slice(0, 10);

  const { data, error } = await adminSupabase
    .from('sales')
    .select('*, employees(nombre, store)')
    .eq('fecha', fecha)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sales: data || [] });
}
