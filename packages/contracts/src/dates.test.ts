import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, diffDays, isIsoDate, isoDateInZone, isoWeekday, startOfIsoWeek, zonedDayStart } from './dates.js';

describe('dates', () => {
  it('validates ISO dates including impossible days', () => {
    assert.equal(isIsoDate('2026-09-30'), true);
    assert.equal(isIsoDate('2026-02-30'), false);
    assert.equal(isIsoDate('30.09.2026'), false);
  });

  it('adds and diffs days across month and year boundaries', () => {
    assert.equal(addDays('2026-12-30', 3), '2027-01-02');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(diffDays('2026-10-14', '2026-09-30'), 14);
    assert.equal(diffDays('2026-09-29', '2026-09-30'), -1);
  });

  it('handles ISO weeks', () => {
    assert.equal(isoWeekday('2026-09-28'), 1);
    assert.equal(isoWeekday('2026-10-04'), 7);
    assert.equal(startOfIsoWeek('2026-10-04'), '2026-09-28');
  });

  it('computes zoned day start for Kyiv in summer and winter', () => {
    assert.equal(zonedDayStart('2026-07-01', 'Europe/Kyiv').toISOString(), '2026-06-30T21:00:00.000Z');
    assert.equal(zonedDayStart('2026-01-15', 'Europe/Kyiv').toISOString(), '2026-01-14T22:00:00.000Z');
    // день переходу на літній час
    assert.equal(zonedDayStart('2026-03-29', 'Europe/Kyiv').toISOString(), '2026-03-28T22:00:00.000Z');
  });

  it('maps an instant to the local calendar day', () => {
    assert.equal(isoDateInZone(new Date('2026-09-30T22:30:00Z'), 'Europe/Kyiv'), '2026-10-01');
    assert.equal(isoDateInZone(new Date('2026-09-30T20:30:00Z'), 'Europe/Kyiv'), '2026-09-30');
  });
});
