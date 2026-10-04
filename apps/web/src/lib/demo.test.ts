import { describe, expect, it, vi } from 'vitest';
import { demoPayments, demoReconciliations, fetchDemo, summarize } from './demo';
import type { PaginatedResponse, Payment, Reconciliation, TrendsResponse } from '@/types/api';

describe('standalone sample-data workspace', () => {
  it('filters before paginating and serves stable detail links', async () => {
    const filtered = demoReconciliations.filter(r => r.status === 'matched');
    const page = await fetchDemo('/reconciliations?status=matched&limit=2&offset=2') as PaginatedResponse<Reconciliation>;
    expect(page.total).toBe(filtered.length);
    expect(page.reconciliations).toEqual(filtered.slice(2, 4));
    const detail = await fetchDemo(`/reconciliations/${filtered[2].id}`);
    expect(detail).toEqual(filtered[2]);
    await expect(fetchDemo('/reconciliations/unknown')).rejects.toThrow('not found');
  });

  it('combines payment status and method filters, including empty results', async () => {
    const result = await fetchDemo('/payments?status=succeeded&payment_method=card&limit=100') as PaginatedResponse<Payment>;
    expect(result.payments).toEqual(demoPayments.filter(p => p.status === 'succeeded' && p.payment_method === 'card'));
    const empty = await fetchDemo('/payments?status=failed') as PaginatedResponse<Payment>;
    expect(empty.total).toBe(0);
    expect(empty.payments).toEqual([]);
  });

  it('keeps dashboard totals, daily trends and linked payments consistent', async () => {
    const summary = summarize(demoReconciliations);
    expect(Object.values(summary.status_counts).reduce((a, b) => a + b, 0)).toBe(demoReconciliations.length);
    expect(summary.amounts.total_internal).toBe(demoPayments.reduce((sum, p) => sum + p.amount, 0));
    for (const r of demoReconciliations) {
      expect(r.delta).toBe(r.external_amount - r.internal_amount);
      expect(r.confidence).toBe(Math.floor(r.score / r.max_score * 100));
      if (r.payment_id) expect(demoPayments.find(p => p.id === r.payment_id)?.amount).toBe(r.internal_amount);
    }
    const result = await fetchDemo('/reconciliations/trends?days=30') as TrendsResponse;
    expect(result.trends.reduce((sum, t) => sum + t.total, 0)).toBe(summary.total_reconciled);
    expect(result.trends.reduce((sum, t) => sum + t.total_discrepancy, 0)).toBe(summary.amounts.total_discrepancy);
    const short = await fetchDemo('/reconciliations/trends?days=3') as TrendsResponse;
    expect(short.trends).toEqual(result.trends.slice(-3));
  });

  it('uses no network and rejects AI or write operations', async () => {
    const network = vi.spyOn(globalThis, 'fetch');
    try {
      await fetchDemo('/reconciliations/summary');
      await expect(fetchDemo('/ask', { method: 'POST' })).rejects.toThrow('read-only');
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  });
});
