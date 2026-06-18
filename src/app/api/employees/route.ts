import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, email, telefono, store, rol, salario_diario, activo } = body;

  if (!nombre || !email || !store) {
    return NextResponse.json({ error: 'Nombre, email y tienda son obligatorios' }, { status: 400 });
  }

  const { data, error } = await adminSupabase.from('employees').insert({
    nombre, email, telefono, store, rol, salario_diario, activo,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}

export async function GET() {
  const { data, error } = await adminSupabase.from('employees').select('*').order('nombre');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data });
}
