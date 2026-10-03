import { describe, expect, it } from 'vitest';
import { toIsoDate } from './date.utils';

describe('toIsoDate', () => {
  it('formats the local calendar date without shifting time zones', () => {
    expect(toIsoDate(new Date(2026, 9, 3, 23, 45))).toBe('2026-10-03');
  });
});
