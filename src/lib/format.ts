import {
  addDays,
  format as formatDate,
  formatDistanceToNowStrict,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Money is handled in integer centavos everywhere in JS to avoid IEEE-754
 * drift; the DB stores numeric(12,2) pesos. Convert at the boundary only:
 * anything read from Postgres goes through `formatPesos`, anything computed
 * in the app stays in centavos until `formatMXN`.
 */
export const IVA_RATE = 0.16;

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

/** $1,234.50 — es-MX currency format. Input in centavos. */
export function formatMXN(centavos: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(centavosToPesos(centavos));
}

/** Same output, for values that arrive from Postgres already in pesos. */
export function formatPesos(pesos: number): string {
  return formatMXN(pesosToCentavos(pesos));
}

/** Peso rounding that matches `round(numeric, 2)` in validate_quote(). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Totals for a set of quote line items, computed exactly the way the database
 * trigger recomputes them. `validate_quote()` rejects a mismatch over one
 * centavo, so this is not a display helper — it is the contract with the DB.
 */
export function quoteTotals(lineItems: Array<{ qty: number; unit_price: number }>): {
  subtotal: number;
  iva: number;
  total: number;
} {
  const subtotal = round2(
    lineItems.reduce((sum, item) => sum + round2(item.qty * item.unit_price), 0),
  );
  const iva = round2(subtotal * IVA_RATE);
  return { subtotal, iva, total: round2(subtotal + iva) };
}

// date-fns ships a single `es` locale (no es-MX variant); formats match MX usage.
export function formatDayLong(date: Date | string): string {
  return formatDate(new Date(date), "EEEE d 'de' MMMM", { locale: es });
}

export function formatDayShort(date: Date | string): string {
  return formatDate(new Date(date), 'd MMM', { locale: es });
}

export function formatTime(date: Date | string): string {
  return formatDate(new Date(date), 'HH:mm');
}

/** Arrival window: "10:00–12:00". */
export function formatWindow(start: Date | string, end: Date | string): string {
  return formatTime(start) + '–' + formatTime(end);
}

/** "hace 3 h" / "hace 2 días" — relative age of a request or quote. */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNowStrict(new Date(date), { locale: es, addSuffix: true });
}

/** "Hoy" / "Mañana" / "vie 5 sep" — the label a person actually scans for. */
export function formatDayLabel(date: Date | string): string {
  const value = new Date(date);
  const today = new Date();
  if (isSameDay(value, today)) return 'Hoy';
  if (isSameDay(value, addDays(today, 1))) return 'Mañana';
  return formatDate(value, 'EEE d MMM', { locale: es });
}

/** The next `count` days starting today, normalized to midnight. */
export function nextDays(count: number): Date[] {
  const base = startOfDay(new Date());
  return Array.from({ length: count }, (_, index) => addDays(base, index));
}

/**
 * Arrival windows offered when a client accepts a quote. Two-hour blocks are
 * the product decision (jobs.window_length caps at four); past blocks are
 * dropped so today's list never offers a slot that already went by.
 */
export const WINDOW_HOURS = [8, 10, 12, 14, 16, 18] as const;

export function windowSlotsForDay(day: Date): Array<{ start: Date; end: Date; label: string }> {
  const now = new Date();
  return WINDOW_HOURS.map((hour) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 2, 0, 0, 0);
    return { start, end, label: formatWindow(start, end) };
  }).filter((slot) => slot.start > now);
}
