import { describe, expect, it } from 'vitest';
import { calculateBalance, getTaskProgress, canAccessRecord } from '../js/core.js';

describe('core math', () => {
  it('calculates net balance correctly', () => {
    const transactions = [
      { type: 'receita', value: 300000 },
      { type: 'despesa', value: 100000 },
      { type: 'despesa', value: 50000 }
    ];

    expect(calculateBalance(transactions)).toBe(150000);
  });

  it('handles debt correctly without breaking', () => {
    const transactions = [
      { type: 'receita', value: 200000 },
      { type: 'despesa', value: 250000 }
    ];

    expect(calculateBalance(transactions)).toBe(-50000);
  });

  it('calculates task progress', () => {
    const tasks = [
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'pendente' },
      { status: 'pendente' }
    ];

    expect(getTaskProgress(tasks)).toEqual({ total: 4, finished: 2, pending: 2, progress: 50 });
  });

  it('blocks cross-user access', () => {
    expect(canAccessRecord('user-a', 'user-b')).toBe(false);
    expect(canAccessRecord('user-a', 'user-a')).toBe(true);
  });
});
