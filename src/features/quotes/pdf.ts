import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { copy } from '@/lib/copy';
import { formatDayLong, formatPesos } from '@/lib/format';
import type { Quote, ServiceRequest } from '@/types/database';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The WhatsApp-shareable quote — the adoption hook for providers who currently
 * send a price as a voice note. Styling is inlined because expo-print renders
 * the string in an isolated web view with no access to the app's stylesheet.
 */
function quoteHtml(quote: Quote, request: ServiceRequest | null, providerName: string): string {
  const rows = quote.line_items
    .map((item) => {
      const label = item.type === 'labor' ? copy.quote.typeLabor : copy.quote.typeMaterial;
      return (
        '<tr>' +
        '<td>' +
        escapeHtml(item.concept) +
        '<div class="muted">' +
        label +
        '</div></td>' +
        '<td class="num">' +
        item.qty +
        '</td>' +
        '<td class="num">' +
        formatPesos(item.unit_price) +
        '</td>' +
        '<td class="num">' +
        formatPesos(item.qty * item.unit_price) +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  return [
    '<!doctype html><html lang="es"><head><meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<style>',
    'body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0D1219;padding:32px;}',
    'h1{font-size:22px;margin:0 0 4px;letter-spacing:-0.4px;}',
    '.brand{color:#0F5FA6;font-weight:800;letter-spacing:2px;font-size:11px;text-transform:uppercase;}',
    '.muted{color:#5B6672;font-size:11px;}',
    '.card{border:1px solid #E2E6EB;border-radius:12px;padding:16px;margin-top:20px;}',
    'table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;}',
    'th{text-align:left;font-size:11px;text-transform:uppercase;color:#5B6672;padding:6px 0;border-bottom:1px solid #E2E6EB;}',
    'td{padding:10px 0;border-bottom:1px solid #EDF0F4;vertical-align:top;}',
    '.num{text-align:right;white-space:nowrap;}',
    '.totals{margin-top:16px;font-size:14px;}',
    '.totals div{display:flex;justify-content:space-between;padding:4px 0;}',
    '.total{font-size:18px;font-weight:700;border-top:2px solid #0D1219;margin-top:8px;padding-top:10px;}',
    '</style></head><body>',
    '<div class="brand">Oficio</div>',
    '<h1>' + escapeHtml(request?.title ?? copy.quote.builderTitle) + '</h1>',
    '<div class="muted">' + escapeHtml(providerName) + ' · ' + formatDayLong(quote.created_at) + '</div>',
    request ? '<div class="card">' + escapeHtml(request.description) + '</div>' : '',
    '<table><thead><tr><th>' + copy.quote.conceptLabel + '</th>',
    '<th class="num">' + copy.quote.qtyLabel + '</th>',
    '<th class="num">' + copy.quote.unitPriceLabel + '</th>',
    '<th class="num">' + copy.quote.total + '</th></tr></thead>',
    '<tbody>' + rows + '</tbody></table>',
    '<div class="totals">',
    '<div><span>' + copy.quote.subtotal + '</span><span>' + formatPesos(quote.subtotal) + '</span></div>',
    '<div><span>' + copy.quote.iva + '</span><span>' + formatPesos(quote.iva) + '</span></div>',
    '<div class="total"><span>' + copy.quote.total + '</span><span>' + formatPesos(quote.total) + '</span></div>',
    '</div>',
    '<p class="muted">' + escapeHtml(copy.quote.validUntil(formatDayLong(quote.valid_until))) + '</p>',
    quote.notes ? '<div class="card">' + escapeHtml(quote.notes) + '</div>' : '',
    '</body></html>',
  ].join('');
}

export async function shareQuotePdf(
  quote: Quote,
  request: ServiceRequest | null,
  providerName: string,
): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: quoteHtml(quote, request, providerName),
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
