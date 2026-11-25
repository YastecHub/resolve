import { z } from 'zod';
import type { ToolDef } from '../ai/types.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { ToolResult, ToolRunner } from './loop.js';
import { maskAccount, maskName, truncateOutput, untrusted } from './sanitize.js';

export interface ToolContext {
  prisma: PrismaClient;
  dispute: { id: string; transactionId: string; customerId: string };
  now: number;
  duplicateWindowMinutes: number;
}

class ToolError extends Error {}

interface Tool<P extends z.ZodType> {
  name: string;
  description: string;
  params: P;
  run(ctx: ToolContext, params: z.infer<P>): Promise<Record<string, unknown>>;
}

const defineTool = <P extends z.ZodType>(tool: Tool<P>) => tool;
const LIST_CAP = 20;
const MINUTE = 60_000;
const iso = (date: Date | null | undefined) => date?.toISOString() ?? null;
const amount = (value: bigint) => Number(value);

/** The model may only read the disputed customer's data. */
async function loadScopedTransaction(ctx: ToolContext, id: string) {
  const txn = await ctx.prisma.transaction.findUnique({ where: { id } });
  if (!txn || txn.customerId !== ctx.dispute.customerId) {
    throw new ToolError(`Transaction ${id} was not found for this customer.`);
  }
  return txn;
}

function assertCustomer(ctx: ToolContext, id: string) {
  if (id !== ctx.dispute.customerId)
    throw new ToolError(`Customer ${id} is not part of this dispute.`);
}

const transactionId = z.object({ transaction_id: z.string().min(1).max(64) });
const customerId = z.object({ customer_id: z.string().min(1).max(64) });

export const getTransaction = defineTool({
  name: 'get_transaction',
  description:
    "Get the disputed transaction or another of the customer's transactions: type, channel, amount in kobo, status, merchant or counterparty, city, IP country and device.",
  params: transactionId,
  async run(ctx, { transaction_id }) {
    const txn = await loadScopedTransaction(ctx, transaction_id);
    const merchant = txn.merchantId
      ? await ctx.prisma.merchant.findUnique({ where: { id: txn.merchantId } })
      : null;
    return {
      transaction_id: txn.id,
      reference: txn.reference,
      type: txn.type,
      channel: txn.channel,
      amount_minor: amount(txn.amountMinor),
      status: txn.status,
      merchant: merchant
        ? {
            id: merchant.id,
            name: untrusted(merchant.name),
            category: merchant.category,
            flagged: merchant.flagged,
          }
        : null,
      counterparty: txn.counterpartyName
        ? { name: untrusted(maskName(txn.counterpartyName)), bank: txn.counterpartyBank }
        : null,
      city: txn.city,
      ip_country: txn.ipCountry,
      device_id: txn.deviceId,
      created_at: txn.createdAt.toISOString(),
    };
  },
});

export const getCustomerProfile = defineTool({
  name: 'get_customer_profile',
  description:
    "Get the customer's profile: segment, risk profile, account age, home city, disputes in the last 90 days, typical (median) amount and usual channels.",
  params: customerId,
  async run(ctx, { customer_id }) {
    assertCustomer(ctx, customer_id);
    const customer = await ctx.prisma.customer.findUnique({ where: { id: customer_id } });
    if (!customer) throw new ToolError(`Customer ${customer_id} was not found.`);
    const since = new Date(ctx.now - 90 * 24 * 60 * MINUTE);
    const [disputes, history] = await Promise.all([
      ctx.prisma.dispute.count({ where: { customerId: customer_id, createdAt: { gte: since } } }),
      ctx.prisma.transaction.findMany({
        where: { customerId: customer_id, createdAt: { gte: since }, status: 'successful' },
        select: { amountMinor: true, channel: true },
      }),
    ]);
    const amounts = history.map((t) => amount(t.amountMinor)).sort((a, b) => a - b);
    const channels = new Map<string, number>();
    for (const t of history) channels.set(t.channel, (channels.get(t.channel) ?? 0) + 1);
    return {
      segment: customer.segment,
      risk_profile: customer.riskProfile,
      account_age_days: customer.accountAgeDays,
      home_city: customer.homeCity,
      dispute_count_90d: disputes,
      typical_amount_minor: amounts.length ? amounts[Math.floor(amounts.length / 2)]! : 0,
      common_channels: [...channels.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c),
    };
  },
});

export const getCustomerHistory = defineTool({
  name: 'get_customer_history',
  description: "List the customer's recent transactions, newest first (at most 20).",
  params: customerId.extend({
    days: z.number().int().min(1).max(365).default(90),
    limit: z.number().int().min(1).max(LIST_CAP).default(LIST_CAP),
  }),
  async run(ctx, { customer_id, days, limit }) {
    assertCustomer(ctx, customer_id);
    const rows = await ctx.prisma.transaction.findMany({
      where: {
        customerId: customer_id,
        createdAt: { gte: new Date(ctx.now - days * 24 * 60 * MINUTE) },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { merchant: { select: { name: true } } },
    });
    return {
      transactions: rows.map((t) => ({
        transaction_id: t.id,
        amount_minor: amount(t.amountMinor),
        merchant_name: t.merchant ? untrusted(t.merchant.name) : null,
        channel: t.channel,
        city: t.city,
        status: t.status,
        created_at: t.createdAt.toISOString(),
      })),
    };
  },
});

export const getLedgerEntries = defineTool({
  name: 'get_ledger_entries',
  description: 'List the ledger entries for a transaction: debits, credits, reversals and refunds.',
  params: transactionId,
  async run(ctx, { transaction_id }) {
    const txn = await loadScopedTransaction(ctx, transaction_id);
    const entries = await ctx.prisma.ledgerEntry.findMany({
      where: { transactionId: txn.id },
      orderBy: { postedAt: 'asc' },
      take: LIST_CAP,
    });
    return {
      transaction_id: txn.id,
      entries: entries.map((e) => ({
        entry_type: e.entryType,
        amount_minor: amount(e.amountMinor),
        account_ref: maskAccount(e.accountRef),
        memo: untrusted(e.memo),
        posted_at: e.postedAt.toISOString(),
      })),
    };
  },
});

export const getSettlementStatus = defineTool({
  name: 'get_settlement_status',
  description:
    'Get the settlement status of the transaction: settled, failed, pending or not applicable, the failure reason, and how many minutes old the transaction is.',
  params: transactionId,
  async run(ctx, { transaction_id }) {
    const txn = await loadScopedTransaction(ctx, transaction_id);
    const settlement = await ctx.prisma.settlement.findUnique({ where: { transactionId: txn.id } });
    return {
      transaction_id: txn.id,
      status: settlement?.status ?? 'not_found',
      failure_reason: settlement?.failureReason ?? null,
      settled_at: iso(settlement?.settledAt),
      age_minutes: Math.max(0, Math.round((ctx.now - txn.createdAt.getTime()) / MINUTE)),
    };
  },
});

export const getDeviceAndLocation = defineTool({
  name: 'get_device_and_location',
  description:
    "Check the device and location of a transaction: whether the device is trusted, when it was first seen, whether the city matches the customer's home city, and the IP country.",
  params: transactionId,
  async run(ctx, { transaction_id }) {
    const txn = await loadScopedTransaction(ctx, transaction_id);
    const [device, customer] = await Promise.all([
      txn.deviceId ? ctx.prisma.device.findUnique({ where: { id: txn.deviceId } }) : null,
      ctx.prisma.customer.findUnique({ where: { id: txn.customerId } }),
    ]);
    return {
      transaction_id: txn.id,
      device: device
        ? { trusted: device.trusted, first_seen_at: device.firstSeenAt.toISOString() }
        : null,
      city_matches_home: customer ? customer.homeCity === txn.city : null,
      ip_country: txn.ipCountry,
      device_first_seen_within_24h: device
        ? txn.createdAt.getTime() - device.firstSeenAt.getTime() < 24 * 60 * MINUTE
        : null,
    };
  },
});

export const getMerchantInfo = defineTool({
  name: 'get_merchant_info',
  description:
    "Get a merchant's category, dispute rate (basis points), whether it is flagged, and how many earlier purchases this customer made there.",
  params: z.object({ merchant_id: z.string().min(1).max(64) }),
  async run(ctx, { merchant_id }) {
    const [merchant, disputed] = await Promise.all([
      ctx.prisma.merchant.findUnique({ where: { id: merchant_id } }),
      ctx.prisma.transaction.findUnique({ where: { id: ctx.dispute.transactionId } }),
    ]);
    const purchases = await ctx.prisma.transaction.count({
      where: {
        customerId: ctx.dispute.customerId,
        merchantId: merchant_id,
        status: 'successful',
        ...(disputed ? { createdAt: { lt: disputed.createdAt } } : {}),
      },
    });
    // Only merchants the customer has dealt with are in scope.
    if (!merchant || (purchases === 0 && disputed?.merchantId !== merchant_id)) {
      throw new ToolError(`Merchant ${merchant_id} was not found for this customer.`);
    }
    return {
      merchant_id: merchant.id,
      name: untrusted(merchant.name),
      category: merchant.category,
      dispute_rate_bps: merchant.disputeRateBps,
      flagged: merchant.flagged,
      customer_prior_purchase_count: purchases,
    };
  },
});

export const findRelatedTransactions = defineTool({
  name: 'find_related_transactions',
  description:
    "Find the customer's other transactions within a time window of this one that share its amount or merchant (at most 20).",
  params: transactionId.extend({ window_minutes: z.number().int().min(1).max(1440).default(30) }),
  async run(ctx, { transaction_id, window_minutes }) {
    const txn = await loadScopedTransaction(ctx, transaction_id);
    const window = window_minutes * MINUTE;
    const rows = await ctx.prisma.transaction.findMany({
      where: {
        customerId: txn.customerId,
        id: { not: txn.id },
        createdAt: {
          gte: new Date(txn.createdAt.getTime() - window),
          lte: new Date(txn.createdAt.getTime() + window),
        },
        OR: [
          { amountMinor: txn.amountMinor },
          ...(txn.merchantId ? [{ merchantId: txn.merchantId }] : []),
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: LIST_CAP,
    });
    return {
      transaction_id: txn.id,
      related: rows.map((r) => ({
        transaction_id: r.id,
        amount_minor: amount(r.amountMinor),
        same_amount: r.amountMinor === txn.amountMinor,
        same_merchant: txn.merchantId !== null && r.merchantId === txn.merchantId,
        seconds_apart: Math.round((r.createdAt.getTime() - txn.createdAt.getTime()) / 1000),
        status: r.status,
      })),
    };
  },
});

export const TOOLS = [
  getTransaction,
  getCustomerProfile,
  getCustomerHistory,
  getLedgerEntries,
  getSettlementStatus,
  getDeviceAndLocation,
  getMerchantInfo,
  findRelatedTransactions,
] as const;

/** Validates, scopes, masks and caps every tool call. Errors go back to the model as data. */
export function createToolRunner(ctx: ToolContext): ToolRunner {
  const byName = new Map<string, Tool<z.ZodType>>(TOOLS.map((t) => [t.name, t as Tool<z.ZodType>]));
  return {
    definitions: (): ToolDef[] =>
      TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: z.toJSONSchema(t.params, { io: 'input' }) as Record<string, unknown>,
      })),
    async run(name, args): Promise<ToolResult> {
      const tool = byName.get(name);
      if (!tool) return { ok: false, error: `Unknown tool "${name}".` };
      if (typeof args === 'object' && args !== null && '__parse_error' in args) {
        return { ok: false, error: 'The arguments were not valid JSON.' };
      }
      const parsed = tool.params.safeParse(args ?? {});
      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues
            .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
            .join('; '),
        };
      }
      try {
        return { ok: true, data: truncateOutput(await tool.run(ctx, parsed.data)) };
      } catch (error) {
        if (error instanceof ToolError) return { ok: false, error: error.message };
        throw error;
      }
    },
  };
}
