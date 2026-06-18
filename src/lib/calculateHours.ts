import { isSameDay } from 'date-fns';
import { isFestivo } from './festivos';
import { Timesheet, Schedule } from './types';

export function calculateDailyHours(
  checkIn: Date,
  checkOut: Date,
  almuerzohoras = 1
): { horasNormales: number; horasExtras: number; totalHoras: number } {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);
  const totalHoras = Math.max(0, diffHoras - almuerzohoras);
  const horasNormales = Math.min(totalHoras, 8);
  const horasExtras = Math.max(0, totalHoras - 8);
  return { horasNormales, horasExtras, totalHoras };
}

export function calculateMonthlyHours(
  timesheets: Timesheet[],
  schedules: Schedule[]
): {
  horasNormales: number;
  horasExtras: number;
  horasFestivas: number;
  diasTrabajados: number;
  diasAusentes: number;
} {
  let horasNormales = 0;
  let horasExtras = 0;
  let horasFestivas = 0;
  let diasTrabajados = 0;
  let diasAusentes = 0;

  schedules.forEach((schedule) => {
    const scheduleDate = new Date(schedule.fecha + 'T00:00:00');
    const esFestivo = isFestivo(scheduleDate) || schedule.es_festivo;

    const timesheet = timesheets.find((t) =>
      isSameDay(new Date(t.fecha + 'T00:00:00'), scheduleDate)
    );

    if (!timesheet?.check_in_time || !timesheet?.check_out_time) {
      diasAusentes++;
      return;
    }

    diasTrabajados++;

    const { horasNormales: norm, horasExtras: ext, totalHoras } =
      calculateDailyHours(
        new Date(timesheet.check_in_time),
        new Date(timesheet.check_out_time)
      );

    if (esFestivo) {
      horasFestivas += totalHoras;
    } else {
      horasNormales += norm;
      horasExtras += ext;
    }
  });

  return { horasNormales, horasExtras, horasFestivas, diasTrabajados, diasAusentes };
}

export function formatHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}h ${m > 0 ? m + 'min' : ''}`.trim();
}
