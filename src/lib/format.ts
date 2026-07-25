import { format as formatDate } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Money is handled in integer centavos everywhere in JS to avoid IEEE-754
 * drift; the DB stores numeric(12,2) pesos. Convert at the boundary only.
 */
export const IVA_RATE = 0.16;

export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

/** $1,234.50 — es-MX currency format. */
export function formatMXN(centavos: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(centavosToPesos(centavos));
}

/** Quote totals from line items, IVA broken out. All in centavos. */
export function computeQuoteTotals(lineItems: Array<{ qty: number; unit_price: number }>): {
  subtotal: number;
  iva: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + Math.round(item.qty * item.unit_price), 0);
  const iva = Math.round(subtotal * IVA_RATE);
  return { subtotal, iva, total: subtotal + iva };
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
  return `${formatTime(start)}–${formatTime(end)}`;
}
