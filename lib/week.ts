export function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Dom, 1=Lun...
  const diff = day === 0 ? -6 : 1 - day; // mover a lunes
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function formatISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatHeaderRange(monday: Date) {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const a = monday.toLocaleDateString("es-SV", opts);
  const b = sunday.toLocaleDateString("es-SV", opts);
  return `${a} – ${b}`;
}

export const DOW_ES = [
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
  "DOMINGO",
];
