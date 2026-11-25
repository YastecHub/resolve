import { formatNaira } from '../agent/prompt.js';

type Output = {
  ok?: boolean;
  error?: string;
  data?: Record<string, unknown>;
  truncated?: boolean;
} | null;

/** `get_settlement_status` → "Get settlement status". */
export function stepTitle(kind: string, toolName: string | null): string {
  if (kind === 'model') return 'Model turn';
  if (!toolName) return 'System';
  const words = toolName.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const naira = (value: unknown) => (typeof value === 'number' ? formatNaira(value) : '?');

/** One human line per step, built from its stored output. */
export function stepSummary(kind: string, toolName: string | null, rawOutput: unknown): string {
  const output = rawOutput as Output;
  if (kind === 'model') {
    const calls = (rawOutput as { toolCalls?: { name: string }[] } | null)?.toolCalls ?? [];
    if (calls.some((c) => c.name === 'submit_decision')) return 'Submitted the decision';
    return calls.length
      ? `Called ${plural(calls.length, 'tool')}`
      : 'Answered without calling a tool';
  }
  if (!output || output.truncated) return 'Output was too large to show';
  if (output.ok === false) return `Failed: ${output.error ?? 'unknown error'}`;
  const d = output.data ?? {};

  switch (toolName) {
    case 'get_transaction': {
      const party = d.merchant
        ? 'merchant payment'
        : d.counterparty
          ? 'transfer'
          : String(d.type ?? '');
      return `${naira(d.amount_minor)} ${party}, ${String(d.status)}, ${String(d.city)}`;
    }
    case 'get_customer_profile':
      return `${String(d.segment)} customer, ${String(d.risk_profile)} risk, typical ${naira(d.typical_amount_minor)}`;
    case 'get_customer_history':
      return `${plural((d.transactions as unknown[] | undefined)?.length ?? 0, 'transaction')} in history`;
    case 'get_ledger_entries': {
      const entries = (d.entries as { entry_type: string }[] | undefined) ?? [];
      if (entries.length === 0) return 'No ledger entries';
      const counts = new Map<string, number>();
      for (const e of entries) counts.set(e.entry_type, (counts.get(e.entry_type) ?? 0) + 1);
      return [...counts.entries()].map(([type, n]) => plural(n, type)).join(', ');
    }
    case 'get_settlement_status': {
      const reason = d.failure_reason ? `: ${String(d.failure_reason)}` : '';
      return `Settlement ${String(d.status)}${reason}, ${String(d.age_minutes)} minutes ago`;
    }
    case 'get_device_and_location': {
      const device = d.device as { trusted?: boolean } | null;
      const deviceText = device
        ? device.trusted
          ? 'trusted device'
          : 'untrusted device'
        : 'no device';
      const city = d.city_matches_home ? 'home city' : 'away from home';
      return `${deviceText}, ${city}, IP ${String(d.ip_country)}`;
    }
    case 'get_merchant_info':
      return `${d.flagged ? 'Flagged' : 'Not flagged'}, ${String(d.dispute_rate_bps)} bps dispute rate, ${plural(Number(d.customer_prior_purchase_count ?? 0), 'prior purchase')}`;
    case 'find_related_transactions': {
      const related =
        (d.related as { same_amount: boolean; same_merchant: boolean }[] | undefined) ?? [];
      const twins = related.filter((r) => r.same_amount && r.same_merchant).length;
      return related.length === 0
        ? 'No related transactions'
        : `${plural(related.length, 'related transaction')}${twins ? `, ${twins} with the same amount and merchant` : ''}`;
    }
    default:
      return 'Done';
  }
}
