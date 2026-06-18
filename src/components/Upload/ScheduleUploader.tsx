'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

interface ScheduleRow {
  email: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  es_festivo: boolean;
}

export default function ScheduleUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { raw: false });

    const errors: string[] = [];
    let success = 0;

    for (const row of rows) {
      const email = row['email']?.trim();
      const fecha = row['fecha']?.trim();
      const hora_entrada = row['hora_entrada']?.trim();
      const hora_salida = row['hora_salida']?.trim();
      const es_festivo = row['es_festivo']?.toString().toLowerCase() === 'true';

      if (!email || !fecha || !hora_entrada || !hora_salida) {
        errors.push(`Fila incompleta: ${email || 'sin email'}`);
        continue;
      }

      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .single();

      if (!emp) {
        errors.push(`Empleado no encontrado: ${email}`);
        continue;
      }

      const { error } = await supabase
        .from('schedules')
        .upsert({
          employee_id: emp.id,
          fecha,
          hora_entrada,
          hora_salida,
          es_festivo,
          es_fuera_horario: false,
        }, { onConflict: 'employee_id,fecha' });

      if (error) {
        errors.push(`Error en ${email} - ${fecha}: ${error.message}`);
      } else {
        success++;
      }
    }

    setResult({ success, errors });
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Formato del archivo CSV/Excel</h3>
        <p className="text-sm text-blue-700 mb-3">El archivo debe tener las siguientes columnas:</p>
        <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-700 overflow-x-auto">
          email | fecha | hora_entrada | hora_salida | es_festivo<br />
          juan@empresa.com | 2026-06-01 | 08:00 | 17:00 | false<br />
          maria@empresa.com | 2026-06-01 | 09:00 | 18:00 | false
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
          id="schedule-upload"
        />
        <label
          htmlFor="schedule-upload"
          className={`cursor-pointer flex flex-col items-center gap-3 ${uploading ? 'opacity-50' : ''}`}
        >
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-700">
              {uploading ? 'Procesando...' : 'Clic para subir archivo'}
            </p>
            <p className="text-sm text-gray-400 mt-1">CSV o Excel (.xlsx)</p>
          </div>
        </label>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">✓ {result.success} horarios cargados exitosamente</p>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium mb-2">Errores ({result.errors.length}):</p>
              <ul className="text-red-600 text-sm space-y-1">
                {result.errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
