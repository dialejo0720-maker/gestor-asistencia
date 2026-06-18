import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/checkin?email=xxx — lookup employee + today's timesheet + today's sales
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

  const { data: emp } = await adminSupabase
    .from('employees').select('*').eq('email', email.toLowerCase()).eq('activo', true).single();
  if (!emp) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: ts }, { data: sales }] = await Promise.all([
    adminSupabase.from('timesheets').select('*').eq('employee_id', emp.id).eq('fecha', today).single(),
    adminSupabase.from('sales').select('*').eq('employee_id', emp.id).eq('fecha', today),
  ]);

  return NextResponse.json({ employee: emp, timesheet: ts || null, sales: sales || [] });
}

// POST /api/checkin — check-in, check-out, or add sale
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, employee_id, location, sale } = body;
  const today = new Date().toISOString().slice(0, 10);

  if (action === 'checkin') {
    const { data, error } = await adminSupabase.from('timesheets').insert({
      employee_id,
      fecha: today,
      check_in_time: new Date().toISOString(),
      ubicacion_texto: location?.store,
      ubicacion_lat: location?.lat,
      ubicacion_lng: location?.lng,
      ubicacion_direccion: location?.address,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ timesheet: data });
  }

  if (action === 'checkout') {
    const { data, error } = await adminSupabase.from('timesheets')
      .update({ check_out_time: new Date().toISOString(), ubicacion_lat: location?.lat, ubicacion_lng: location?.lng })
      .eq('employee_id', employee_id).eq('fecha', today).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ timesheet: data });
  }

  if (action === 'sale') {
    const { data, error } = await adminSupabase.from('sales').insert({
      employee_id,
      fecha: today,
      monto: sale.monto,
      descripcion: sale.descripcion,
      store: sale.store,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sale: data });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}
