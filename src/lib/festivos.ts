export const festivos2026: Date[] = [
  new Date(2026, 0, 1),
  new Date(2026, 0, 12),
  new Date(2026, 2, 30),
  new Date(2026, 3, 10),
  new Date(2026, 4, 1),
  new Date(2026, 5, 8),
  new Date(2026, 5, 15),
  new Date(2026, 6, 1),
  new Date(2026, 7, 7),
  new Date(2026, 7, 17),
  new Date(2026, 10, 1),
  new Date(2026, 10, 9),
  new Date(2026, 11, 8),
  new Date(2026, 11, 25),
];

export function isFestivo(date: Date): boolean {
  return festivos2026.some(
    (f) => f.toDateString() === date.toDateString()
  );
}
