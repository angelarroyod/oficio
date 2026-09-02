/**
 * Runnable self-check for the pure logic that has no UI to look at: the money
 * path (which the database will reject if it drifts by more than a centavo)
 * and the distance math behind the provider feed.
 *
 *   npm run check
 *
 * Node runs the TypeScript directly, so there is no test framework and no
 * build step to keep alive. Only modules free of React Native imports can be
 * exercised here — that constraint is why `quoteTotals` lives in lib/format
 * and `distanceKm` in lib/geo.
 */
import assert from 'node:assert/strict';

import { distanceKm } from '../src/lib/geo.ts';
import { quoteTotals, round2 } from '../src/lib/format.ts';

// --- money -----------------------------------------------------------------

{
  const totals = quoteTotals([{ qty: 1, unit_price: 1000 }]);
  assert.equal(totals.subtotal, 1000);
  assert.equal(totals.iva, 160, 'IVA is 16% of subtotal');
  assert.equal(totals.total, 1160);
}

{
  // Multiple lines: each is rounded before summing, exactly like the trigger's
  // round(qty * unit_price, 2) inside the loop.
  const totals = quoteTotals([
    { qty: 3, unit_price: 133.33 },
    { qty: 1, unit_price: 250.5 },
  ]);
  assert.equal(totals.subtotal, round2(399.99 + 250.5));
  assert.equal(totals.total, round2(totals.subtotal + totals.iva));
}

{
  // The classic float trap: 0.1 * 3 is 0.30000000000000004 in IEEE-754.
  const totals = quoteTotals([{ qty: 3, unit_price: 0.1 }]);
  assert.equal(totals.subtotal, 0.3);
}

{
  // Every total must survive the DB's tolerance check: |client - db| <= 0.01.
  const items = [
    { qty: 2.5, unit_price: 799.99 },
    { qty: 7, unit_price: 45.5 },
    { qty: 1, unit_price: 12345.67 },
  ];
  const totals = quoteTotals(items);
  const recomputed = items.reduce((sum, item) => sum + round2(item.qty * item.unit_price), 0);
  assert.ok(Math.abs(totals.subtotal - recomputed) <= 0.01);
  assert.ok(Math.abs(totals.iva - round2(totals.subtotal * 0.16)) <= 0.01);
  assert.ok(Math.abs(totals.total - (totals.subtotal + totals.iva)) <= 0.01);
}

assert.deepEqual(quoteTotals([]), { subtotal: 0, iva: 0, total: 0 }, 'empty quote is free');

// --- distance --------------------------------------------------------------

{
  const zocalo = { lat: 19.4326, lng: -99.1332 };
  assert.equal(distanceKm(zocalo, zocalo), 0);

  // Zócalo → Ciudad Universitaria is roughly 12 km line-of-sight.
  const cu = { lat: 19.3229, lng: -99.1861 };
  const km = distanceKm(zocalo, cu);
  assert.ok(km > 11 && km < 14, 'expected ~12 km, got ' + km);

  // Symmetry, since the feed sorts on this value.
  assert.equal(distanceKm(zocalo, cu), distanceKm(cu, zocalo));

  // A 25 km radius must not swallow Toluca (~60 km out).
  const toluca = { lat: 19.2826, lng: -99.6557 };
  assert.ok(distanceKm(zocalo, toluca) > 50);
}

console.log('checks passed');
