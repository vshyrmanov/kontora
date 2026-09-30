import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSeries, seriesUnitFor } from './series.js';
import { getPickupStatus } from './status.js';

describe('getPickupStatus', () => {
  const today = '2026-09-30';
  it('derives status from pickup date and issue date', () => {
    assert.equal(getPickupStatus({ pickupDate: '2026-09-29', issuedAt: null }, today), 'overdue');
    assert.equal(getPickupStatus({ pickupDate: today, issuedAt: null }, today), 'today');
    assert.equal(getPickupStatus({ pickupDate: '2026-10-02', issuedAt: null }, today), 'waiting');
    assert.equal(getPickupStatus({ pickupDate: '2026-09-01', issuedAt: '2026-09-02' }, today), 'issued');
  });
});

describe('buildSeries', () => {
  it('picks a unit by range length', () => {
    assert.equal(seriesUnitFor('2026-09-01', '2026-09-30'), 'day');
    assert.equal(seriesUnitFor('2026-07-01', '2026-09-30'), 'week');
    assert.equal(seriesUnitFor('2025-09-01', '2026-09-30'), 'month');
  });

  it('fills gaps with zeros for daily series', () => {
    const counts = new Map([['2026-09-28', 2], ['2026-09-30', 1]]);
    assert.deepEqual(buildSeries('2026-09-28', '2026-09-30', counts), [
      { key: '2026-09-28', value: 2 },
      { key: '2026-09-29', value: 0 },
      { key: '2026-09-30', value: 1 },
    ]);
  });

  it('groups by ISO week starting on Monday', () => {
    const counts = new Map([['2026-09-27', 1], ['2026-09-28', 3], ['2026-10-04', 2]]);
    assert.deepEqual(buildSeries('2026-09-27', '2026-10-04', counts, 'week'), [
      { key: '2026-09-21', value: 1 },
      { key: '2026-09-28', value: 5 },
    ]);
  });
});
