import type { ResolutionAction } from '../common/domain.js';
import { newId } from '../common/ids.js';
import type { Prisma, Transaction } from '../generated/prisma/client.js';

export class ExecutionError extends Error {
  constructor(readonly code: 'no_duplicate_pair') {
    super(code === 'no_duplicate_pair' ? 'No matching duplicate payment was found.' : code);
  }
}

export interface ExecuteInput {
  disputeId: string;
  action: ResolutionAction;
  actor: 'agent' | 'analyst';
  duplicateWindowMinutes: number;
}

export interface ExecuteResult {
  applied: boolean;
  status: 'resolved' | 'rejected';
  skipped: 'already_final' | 'entry_exists' | null;
}

/** Of the pair of identical payments, the later one (ties broken by ID). */
export async function findLaterDuplicate(
  tx: Prisma.TransactionClient,
  disputed: Transaction,
  windowMinutes: number,
): Promise<Transaction> {
  const window = windowMinutes * 60_000;
  const twins = await tx.transaction.findMany({
    where: {
      id: { not: disputed.id },
      customerId: disputed.customerId,
      merchantId: disputed.merchantId,
      amountMinor: disputed.amountMinor,
      status: { in: ['successful', 'reversed'] },
      createdAt: {
        gte: new Date(disputed.createdAt.getTime() - window),
        lte: new Date(disputed.createdAt.getTime() + window),
      },
    },
  });
  if (!disputed.merchantId || twins.length === 0) throw new ExecutionError('no_duplicate_pair');
  const later = (a: Transaction, b: Transaction) =>
    a.createdAt.getTime() !== b.createdAt.getTime()
      ? a.createdAt.getTime() > b.createdAt.getTime()
      : a.id > b.id;
  const twin = twins.reduce((best, t) => (later(t, best) ? t : best));
  return later(twin, disputed) ? twin : disputed;
}

/**
 * The only code that moves money. Runs inside the caller's transaction so analyst actions
 * can record themselves atomically with it. Idempotent: a finished dispute or an existing
 * reversal or refund is left alone.
 */
export async function executeResolution(
  tx: Prisma.TransactionClient,
  input: ExecuteInput,
  now = new Date(),
): Promise<ExecuteResult> {
  const dispute = await tx.dispute.findUniqueOrThrow({ where: { id: input.disputeId } });
  if (dispute.status === 'resolved' || dispute.status === 'rejected') {
    return { applied: false, status: dispute.status, skipped: 'already_final' };
  }

  const status = input.action === 'none' ? 'rejected' : 'resolved';
  let skipped: ExecuteResult['skipped'] = null;

  if (input.action !== 'none') {
    const disputed = await tx.transaction.findUniqueOrThrow({
      where: { id: dispute.transactionId },
    });
    const target =
      input.action === 'reverse_debit'
        ? disputed
        : await findLaterDuplicate(tx, disputed, input.duplicateWindowMinutes);
    const entryType = input.action === 'reverse_debit' ? 'reversal' : 'refund';
    const entries = await tx.ledgerEntry.findMany({ where: { transactionId: target.id } });

    if (entries.some((e) => e.entryType === entryType)) {
      skipped = 'entry_exists';
    } else {
      const debit = entries.find((e) => e.entryType === 'debit');
      await tx.ledgerEntry.create({
        data: {
          id: newId('led'),
          transactionId: target.id,
          entryType,
          accountRef: debit?.accountRef ?? '0000000000',
          amountMinor: target.amountMinor,
          memo:
            input.action === 'reverse_debit'
              ? `REVERSAL OF ${target.reference}`
              : `REFUND OF DUPLICATE ${target.reference}`,
          postedAt: now,
        },
      });
    }
    await tx.transaction.update({ where: { id: target.id }, data: { status: 'reversed' } });
  }

  await tx.dispute.update({
    where: { id: dispute.id },
    data: {
      status,
      resolutionAction: input.action,
      resolvedBy: input.actor,
      resolvedAt: now,
      lastError: null,
    },
  });
  return { applied: true, status, skipped };
}
