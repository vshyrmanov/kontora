import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { initials, nextSlotLocalInput, plural } from './format.ts';

describe('format', () => {
  it('pluralizes Ukrainian nouns', () => {
    const forms: [string, string, string] = ['документ', 'документи', 'документів'];
    assert.equal(plural(1, forms), 'документ');
    assert.equal(plural(3, forms), 'документи');
    assert.equal(plural(11, forms), 'документів');
    assert.equal(plural(22, forms), 'документи');
    assert.equal(plural(25, forms), 'документів');
  });

  it('builds initials', () => {
    assert.equal(initials('Олена Коваль'), 'ОК');
    assert.equal(initials('Остап'), 'О');
  });

  it('rounds the next slot to 15 minutes', () => {
    assert.equal(nextSlotLocalInput(new Date(2026, 8, 30, 10, 7)), '2026-09-30T10:15');
    assert.equal(nextSlotLocalInput(new Date(2026, 8, 30, 10, 50)), '2026-09-30T11:00');
  });
});
