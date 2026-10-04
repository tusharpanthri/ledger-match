import type { Payment, Reconciliation, ReconciliationStatus, ReconciliationSummary, TrendsResponse } from '@/types/api';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Entirely fictional, deterministic fixtures. Money is in integer minor units.
const statuses: ReconciliationStatus[] = ['matched', 'matched', 'matched', 'matched_with_fee', 'matched_with_fee', 'amount_mismatch', 'missing_internal', 'missing_external', 'duplicate'];
const names = ['Alex Demo', 'Jordan Sample', 'Taylor Example', 'Morgan Demo', 'Casey Sample', 'Riley Example'];
const uuid = (kind: number, i: number) => `00000000-0000-4000-8000-${String(kind * 1000 + i).padStart(12, '0')}`;
const timestamp = (i: number) => `2026-09-${String(17 + Math.floor(i / 4)).padStart(2, '0')}T14:00:00Z`;

export const demoReconciliations: Reconciliation[] = Array.from({ length: 48 }, (_, i) => {
  const status = statuses[i % statuses.length];
  const provider = i % 3;
  const amount = 2500 + i * 375;
  const fee = provider === 2 ? 0 : 75 + i * 5;
  const internal = status === 'missing_internal' ? 0 : amount;
  const external = status === 'missing_external' ? 0 : status === 'matched_with_fee' ? amount - fee : status === 'amount_mismatch' ? amount - 40 : amount;
  const maxScore = provider === 1 ? 180 : 230;
  const score = status === 'missing_internal' || status === 'missing_external' ? 0 : maxScore - (status === 'matched_with_fee' ? 20 : status === 'amount_mismatch' ? 40 : 0);
  const notes: Partial<Record<ReconciliationStatus, string>> = {
    matched: 'Exact amount, identifying fields and date match.',
    matched_with_fee: `Provider settlement equals internal amount less ${fee} cents in fees.`,
    amount_mismatch: 'Provider amount differs by 40 cents; identifying fields and date match.',
    missing_internal: 'Simulated provider record has no internal counterpart.',
    missing_external: 'Internal payment has no simulated provider settlement.',
    duplicate: 'Two fictional internal candidates share matching fields; review required.',
  };
  return {
    id: uuid(1, i), code: `REC-2026-09-${String(i + 1).padStart(6, '0')}`, status,
    payment_id: status === 'missing_internal' ? null : uuid(2, i),
    internal_amount: internal, external_amount: external, delta: external - internal,
    stripe_payment_id: provider === 0 && status !== 'missing_external' ? uuid(3, i) : null,
    paypal_payment_id: provider === 1 && status !== 'missing_external' ? uuid(3, i) : null,
    bank_transfer_id: provider === 2 && status !== 'missing_external' ? uuid(3, i) : null,
    currency_id: uuid(4, 0), currency_code: 'USD', currency_symbol: '$',
    score, max_score: maxScore, confidence: Math.floor(score / maxScore * 100),
    notes: notes[status] ?? null, reconciled_by: 'Sample fixture',
    reconciled_at: timestamp(i), created_at: timestamp(i), updated_at: timestamp(i),
  };
});

export const demoPayments: Payment[] = demoReconciliations.flatMap((r, i) => {
  if (!r.payment_id) return [];
  const provider = i % 3;
  const card = provider === 0;
  const bank = provider === 2;
  const fee = bank ? 0 : 75 + i * 5;
  return [{
    id: r.payment_id, code: `PAY-2026-09-${String(i + 1).padStart(6, '0')}`,
    merchant_id: uuid(5, i % 3), provider_id: uuid(6, provider),
    status: r.status === 'missing_external' ? 'pending' : 'succeeded',
    payment_method: card ? 'card' : bank ? 'bank_transfer' : 'paypal_wallet',
    amount: r.internal_amount, fee, net: r.internal_amount - fee,
    currency_id: r.currency_id, currency_code: 'USD', currency_symbol: '$',
    customer_id: uuid(7, i), customer_name: names[i % names.length],
    customer_email: `sample${i + 1}@example.com`, description: 'Fictional demo purchase',
    card_bin: card ? '424242' : null, card_last_four: card ? '4242' : null,
    card_masked: card ? '**** 4242' : null, card_brand: card ? 'Demo card' : null,
    iban_country: bank ? 'GB' : null, iban_bank: null, iban_branch: null,
    iban_last_four: bank ? '0000' : null, iban_masked: bank ? 'GB ** 0000 (sample)' : null,
    processed_at: r.created_at, created_at: r.created_at, updated_at: r.updated_at,
  } satisfies Payment];
});

export function summarize(rows: Reconciliation[]): ReconciliationSummary {
  const status_counts: ReconciliationSummary['status_counts'] = { matched: 0, matched_with_fee: 0, amount_mismatch: 0, missing_internal: 0, missing_external: 0, duplicate: 0, disputed: 0 };
  const by_provider = { stripe: 0, paypal: 0, bank: 0 };
  const amounts = { total_internal: 0, total_external: 0, total_discrepancy: 0 };
  for (const r of rows) {
    status_counts[r.status]++;
    if (r.stripe_payment_id) by_provider.stripe++;
    if (r.paypal_payment_id) by_provider.paypal++;
    if (r.bank_transfer_id) by_provider.bank++;
    amounts.total_internal += r.internal_amount;
    amounts.total_external += r.external_amount;
    amounts.total_discrepancy += Math.abs(r.delta);
  }
  const confidences = rows.map(r => r.confidence);
  return {
    total_reconciled: rows.length, status_counts, by_provider, amounts,
    match_rate: rows.length ? Math.round((status_counts.matched + status_counts.matched_with_fee) / rows.length * 100) : 0,
    confidence: {
      average: rows.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / rows.length) : 0,
      min: rows.length ? Math.min(...confidences) : 0, max: rows.length ? Math.max(...confidences) : 0,
    },
  };
}

function paginate<T>(rows: T[], params: URLSearchParams) {
  const limit = Math.max(1, Number(params.get('limit')) || 20);
  const offset = Math.max(0, Number(params.get('offset')) || 0);
  return { total: rows.length, limit, offset, rows: rows.slice(offset, offset + limit) };
}

export async function fetchDemo(path: string, options?: RequestInit): Promise<unknown> {
  if (options?.method && options.method !== 'GET') throw new Error('The sample-data demo is read-only. AI and write operations require the backend.');
  const url = new URL(path, 'https://demo.invalid');
  const params = url.searchParams;
  if (url.pathname === '/reconciliations/summary') return summarize(demoReconciliations);
  if (url.pathname === '/reconciliations/trends') {
    const days = Math.max(1, Math.min(30, Number(params.get('days')) || 30));
    const dates = [...new Set(demoReconciliations.map(r => r.reconciled_at.slice(0, 10)))].sort().slice(-days);
    return { days, trends: dates.map(date => {
      const summary = summarize(demoReconciliations.filter(r => r.reconciled_at.startsWith(date)));
      return { date, total: summary.total_reconciled,
        matched: summary.status_counts.matched + summary.status_counts.matched_with_fee,
        amount_mismatch: summary.status_counts.amount_mismatch, missing_internal: summary.status_counts.missing_internal,
        match_rate: summary.match_rate, ...summary.amounts, avg_confidence: summary.confidence.average, by_provider: summary.by_provider };
    }) } satisfies TrendsResponse;
  }
  if (url.pathname === '/payments') {
    const filtered = demoPayments.filter(r => (!params.get('status') || r.status === params.get('status')) && (!params.get('payment_method') || r.payment_method === params.get('payment_method')));
    const { rows, ...pagination } = paginate(filtered, params);
    return { ...pagination, payments: rows };
  }
  if (url.pathname === '/reconciliations') {
    const filtered = demoReconciliations.filter(r => !params.get('status') || r.status === params.get('status'));
    const { rows, ...pagination } = paginate(filtered, params);
    return { ...pagination, reconciliations: rows };
  }
  if (url.pathname.startsWith('/reconciliations/')) {
    const row = demoReconciliations.find(r => r.id === url.pathname.split('/').pop());
    if (row) return row;
    throw new Error('Reconciliation not found');
  }
  throw new Error(`Unavailable in sample-data mode: ${url.pathname}`);
}
