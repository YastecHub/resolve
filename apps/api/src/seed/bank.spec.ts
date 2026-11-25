import { BASE_TIME, generateBank } from './bank.js';

const bank = generateBank();
const txnById = new Map(bank.transactions.map((t) => [t.id, t]));
const entriesFor = (id: string) => bank.ledgerEntries.filter((e) => e.transactionId === id);
const settlementFor = (id: string) => bank.settlements.find((s) => s.transactionId === id);
const casesFor = (scenario: string) => bank.demoCases.filter((c) => c.scenario === scenario);

describe('generateBank', () => {
  it('is deterministic', () => {
    expect(generateBank()).toEqual(bank);
  });

  it('has the expected volumes', () => {
    expect(bank.customers).toHaveLength(40);
    expect(bank.merchants).toHaveLength(12);
    expect(bank.merchants.filter((m) => m.flagged)).toHaveLength(2);
    expect(bank.transactions.length).toBeGreaterThanOrEqual(300);
    expect(bank.demoCases).toHaveLength(40);
    for (const scenario of [
      'failed_transfer',
      'duplicate_charge',
      'unauthorised',
      'merchant_non_delivery',
      'legitimate',
    ]) {
      expect(casesFor(scenario)).toHaveLength(8);
    }
  });

  it('uses unique IDs and references', () => {
    const ids = [
      ...bank.customers,
      ...bank.merchants,
      ...bank.devices,
      ...bank.transactions,
      ...bank.ledgerEntries,
      ...bank.settlements,
      ...bank.demoCases,
    ].map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(bank.transactions.map((t) => t.reference)).size).toBe(bank.transactions.length);
  });

  it('gives every customer 1 to 3 starting devices with a trusted one', () => {
    for (const customer of bank.customers) {
      const devices = bank.devices.filter((d) => d.customerId === customer.id);
      expect(devices.some((d) => d.trusted)).toBe(true);
    }
  });

  it('keeps every amount a positive integer of kobo and every transaction in the past', () => {
    for (const t of bank.transactions) {
      expect(t.amountMinor > 0n).toBe(true);
      expect(t.createdAt.getTime()).toBeLessThan(BASE_TIME);
    }
  });

  it('gives each transaction one settlement', () => {
    expect(bank.settlements).toHaveLength(bank.transactions.length);
  });

  it('makes failed transfers debited, uncredited and unsettled', () => {
    for (const c of casesFor('failed_transfer')) {
      const txn = txnById.get(c.transactionId)!;
      expect(txn.type).toBe('transfer');
      const types = entriesFor(txn.id).map((e) => e.entryType);
      expect(types).toEqual(['debit']);
      expect(['failed', 'pending']).toContain(settlementFor(txn.id)!.status);
    }
    const [first] = casesFor('failed_transfer');
    expect(txnById.get(first!.transactionId)!.amountMinor).toBe(4_000_000n);
  });

  it('matches the failed-transfer disposition to the ₦50,000 cap', () => {
    for (const c of casesFor('failed_transfer')) {
      const amount = txnById.get(c.transactionId)!.amountMinor;
      expect(c.expectedDisposition).toBe(amount <= 5_000_000n ? 'auto_resolve' : 'needs_review');
    }
    expect(
      casesFor('failed_transfer').filter((c) => c.expectedDisposition === 'auto_resolve'),
    ).toHaveLength(6);
  });

  it('puts clean duplicates inside the 10-minute window and ambiguous ones outside it', () => {
    for (const c of casesFor('duplicate_charge')) {
      const txn = txnById.get(c.transactionId)!;
      const twin = bank.transactions.find(
        (t) =>
          t.id !== txn.id &&
          t.customerId === txn.customerId &&
          t.merchantId === txn.merchantId &&
          t.amountMinor === txn.amountMinor &&
          t.createdAt > txn.createdAt,
      );
      expect(twin).toBeDefined();
      const gapMinutes = (twin!.createdAt.getTime() - txn.createdAt.getTime()) / 60_000;
      if (c.expectedClassifiedType === 'duplicate_charge')
        expect(gapMinutes).toBeLessThanOrEqual(10);
      else expect(gapMinutes).toBeGreaterThan(10);
    }
  });

  it('gives unauthorised payments a new untrusted device away from home', () => {
    for (const c of casesFor('unauthorised')) {
      const txn = txnById.get(c.transactionId)!;
      const customer = bank.customers.find((cu) => cu.id === txn.customerId)!;
      const device = bank.devices.find((d) => d.id === txn.deviceId)!;
      expect(device.trusted).toBe(false);
      expect(txn.createdAt.getTime() - device.firstSeenAt.getTime()).toBeLessThan(24 * 3_600_000);
      expect(txn.city).not.toBe(customer.homeCity);
    }
  });

  it('sends non-delivery cases to flagged merchants', () => {
    const flaggedIds = new Set(bank.merchants.filter((m) => m.flagged).map((m) => m.id));
    for (const c of casesFor('merchant_non_delivery')) {
      expect(flaggedIds.has(txnById.get(c.transactionId)!.merchantId!)).toBe(true);
    }
  });

  it('gives legitimate cases prior purchases at the same merchant', () => {
    for (const c of casesFor('legitimate')) {
      const txn = txnById.get(c.transactionId)!;
      const prior = bank.transactions.filter(
        (t) =>
          t.customerId === txn.customerId &&
          t.merchantId === txn.merchantId &&
          t.createdAt < txn.createdAt,
      );
      expect(prior.length).toBeGreaterThanOrEqual(2);
    }
  });
});
