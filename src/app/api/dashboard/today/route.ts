import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const { data } = await adminSupabase
    .from('timesheets')
    .select('employee_id, check_in_time, check_out_time, ubicacion_lat, ubicacion_lng, ubicacion_direccion')
    .eq('fecha', date)
    .not('check_in_time', 'is', null);
  return NextResponse.json({ timesheets: data || [] });
}
