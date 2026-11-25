import { ensureBootstrapAdmin } from '../auth/bootstrap.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import { generateBank, type SeedBank } from './bank.js';

/** Writes the synthetic bank and demo cases. Skips when the bank is already there. */
export async function seedDatabase(prisma: PrismaClient, bank: SeedBank = generateBank()) {
  const admin = await ensureBootstrapAdmin(prisma);
  if ((await prisma.customer.count()) > 0) return { seeded: false, admin };
  await writeBank(prisma, bank);
  return { seeded: true, admin };
}

export async function writeBank(
  prisma: Pick<
    PrismaClient,
    | 'merchant'
    | 'customer'
    | 'device'
    | 'transaction'
    | 'ledgerEntry'
    | 'settlement'
    | 'demoCase'
    | '$transaction'
  >,
  bank: SeedBank,
) {
  await prisma.$transaction([
    prisma.merchant.createMany({ data: bank.merchants }),
    prisma.customer.createMany({ data: bank.customers }),
    prisma.device.createMany({ data: bank.devices }),
    prisma.transaction.createMany({ data: bank.transactions }),
    prisma.ledgerEntry.createMany({ data: bank.ledgerEntries }),
    prisma.settlement.createMany({ data: bank.settlements }),
    prisma.demoCase.createMany({ data: bank.demoCases }),
  ]);
}
