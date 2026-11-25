import { ulid, type IdPrefix } from '../common/ids.js';
import type { ClassifiedType, DisputeReasonCode, PolicyDisposition } from '../common/domain.js';
import { Rng } from './random.js';

/** Every timestamp in the synthetic bank is relative to this instant. */
export const BASE_TIME = Date.UTC(2026, 10, 25, 8, 0, 0);
export const SEED = 20261125;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Segment = 'retail' | 'sme';
type Risk = 'low' | 'medium' | 'high';
type TxnType = 'card_payment' | 'transfer' | 'pos' | 'web';
type Channel = 'mobile' | 'web' | 'pos' | 'atm' | 'ussd';
type TxnStatus = 'successful' | 'failed' | 'pending' | 'reversed';

export interface SeedCustomer {
  id: string;
  fullName: string;
  phoneMasked: string;
  segment: Segment;
  accountAgeDays: number;
  riskProfile: Risk;
  homeCity: string;
  createdAt: Date;
}

export interface SeedMerchant {
  id: string;
  name: string;
  category: string;
  country: string;
  disputeRateBps: number;
  flagged: boolean;
  createdAt: Date;
}

export interface SeedDevice {
  id: string;
  customerId: string;
  fingerprint: string;
  label: string;
  trusted: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastCity: string;
}

export interface SeedTransaction {
  id: string;
  reference: string;
  customerId: string;
  merchantId: string | null;
  counterpartyName: string | null;
  counterpartyBank: string | null;
  type: TxnType;
  channel: Channel;
  amountMinor: bigint;
  currency: string;
  status: TxnStatus;
  deviceId: string | null;
  city: string;
  ipCountry: string;
  createdAt: Date;
}

export interface SeedLedgerEntry {
  id: string;
  transactionId: string;
  entryType: 'debit' | 'credit' | 'reversal' | 'refund';
  accountRef: string;
  amountMinor: bigint;
  memo: string;
  postedAt: Date;
}

export interface SeedSettlement {
  id: string;
  transactionId: string;
  status: 'settled' | 'failed' | 'pending' | 'not_applicable';
  failureReason: string | null;
  settledAt: Date | null;
}

export type Scenario =
  'failed_transfer' | 'duplicate_charge' | 'unauthorised' | 'merchant_non_delivery' | 'legitimate';

export interface SeedDemoCase {
  id: string;
  scenario: Scenario;
  transactionId: string;
  reasonCode: DisputeReasonCode;
  customerNotes: string | null;
  expectedClassifiedType: ClassifiedType;
  expectedDisposition: PolicyDisposition;
  consumedDisputeId: null;
}

export interface SeedBank {
  customers: SeedCustomer[];
  merchants: SeedMerchant[];
  devices: SeedDevice[];
  transactions: SeedTransaction[];
  ledgerEntries: SeedLedgerEntry[];
  settlements: SeedSettlement[];
  demoCases: SeedDemoCase[];
}

const FIRST_NAMES = [
  'Funke',
  'Ada',
  'Tunde',
  'Chioma',
  'Bola',
  'Emeka',
  'Ngozi',
  'Yusuf',
  'Aisha',
  'Segun',
  'Kemi',
  'Ibrahim',
  'Zainab',
  'Obinna',
  'Tolu',
  'Halima',
  'Chinedu',
  'Folake',
  'Musa',
  'Amaka',
  'Femi',
  'Hauwa',
  'Ifeanyi',
  'Bisi',
  'Sani',
  'Uche',
  'Damilola',
  'Fatima',
  'Kelechi',
  'Wale',
];
const LAST_NAMES = [
  'Adebayo',
  'Okafor',
  'Bello',
  'Eze',
  'Ogunleye',
  'Abubakar',
  'Nwosu',
  'Adeyemi',
  'Umar',
  'Okeke',
  'Balogun',
  'Lawal',
  'Obi',
  'Afolabi',
  'Danjuma',
  'Chukwu',
  'Oyelaran',
  'Ibekwe',
  'Salami',
  'Akande',
];
const CITIES = [
  'Abeokuta',
  'Ijebu-Ode',
  'Sagamu',
  'Ota', // Ogun
  'Ikeja',
  'Lekki',
  'Surulere',
  'Yaba', // Lagos
  'Ibadan',
  'Ogbomoso',
  'Oyo', // Oyo
  'Garki',
  'Wuse',
  'Maitama', // Abuja
];
const BANKS = ['GTBank', 'Access', 'Zenith', 'First Bank', 'UBA', 'Fidelity', 'Moniepoint', 'OPay'];
const DEVICE_LABELS = [
  'Tecno Spark',
  'Infinix Hot',
  'Samsung A15',
  'iPhone 13',
  'itel P55',
  'Redmi Note',
];
const FOREIGN_IPS = ['GH', 'GB', 'US', 'ZA'];

const MERCHANTS: Omit<SeedMerchant, 'id' | 'createdAt' | 'country'>[] = [
  { name: 'Mainland Mart', category: 'groceries', disputeRateBps: 35, flagged: false },
  { name: 'Lekki Fresh Foods', category: 'groceries', disputeRateBps: 28, flagged: false },
  { name: 'Naija Airtime', category: 'telecoms', disputeRateBps: 18, flagged: false },
  { name: 'Eko Electronics', category: 'electronics', disputeRateBps: 95, flagged: false },
  { name: 'Arewa Pharmacy', category: 'health', disputeRateBps: 22, flagged: false },
  { name: 'Gidi Rides', category: 'transport', disputeRateBps: 60, flagged: false },
  { name: 'Owambe Tickets', category: 'events', disputeRateBps: 110, flagged: false },
  { name: 'Ofada Kitchen', category: 'restaurants', disputeRateBps: 40, flagged: false },
  { name: 'Zuma Fuel', category: 'fuel', disputeRateBps: 15, flagged: false },
  { name: 'Ibadan Books', category: 'retail', disputeRateBps: 30, flagged: false },
  { name: 'FlashGadgets NG', category: 'electronics', disputeRateBps: 780, flagged: true },
  { name: 'Bargain Hub Online', category: 'marketplace', disputeRateBps: 620, flagged: true },
];

/** Builds the whole synthetic bank from a fixed seed. Same output on every run. */
export function generateBank(seed = SEED): SeedBank {
  const rng = new Rng(seed);
  let clock = BASE_TIME - 400 * DAY;
  const id = (prefix: IdPrefix, at?: number) => `${prefix}_${ulid(at ?? clock++, rng.bytes(16))}`;
  let refCounter = 114_800;
  const reference = () => `TX-2026-${refCounter++}`;

  const bank: SeedBank = {
    customers: [],
    merchants: [],
    devices: [],
    transactions: [],
    ledgerEntries: [],
    settlements: [],
    demoCases: [],
  };

  // Merchants
  for (const merchant of MERCHANTS) {
    bank.merchants.push({
      ...merchant,
      id: id('mer'),
      country: 'NG',
      createdAt: new Date(BASE_TIME - 700 * DAY),
    });
  }
  const regular = bank.merchants.filter((m) => !m.flagged);
  const flagged = bank.merchants.filter((m) => m.flagged);

  // Customers, their devices, account numbers and typical spend
  const usedNames = new Set<string>();
  const accountOf = new Map<string, string>();
  const typicalOf = new Map<string, number>();
  const trustedDeviceOf = new Map<string, SeedDevice>();
  for (let i = 0; i < 40; i++) {
    let fullName: string;
    do fullName = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    while (usedNames.has(fullName));
    usedNames.add(fullName);

    const accountAgeDays = rng.int(90, 3000);
    const customer: SeedCustomer = {
      id: id('cus'),
      fullName,
      phoneMasked: `****${rng.int(1000, 9999)}`,
      segment: rng.chance(0.25) ? 'sme' : 'retail',
      accountAgeDays,
      riskProfile: rng.pick(['low', 'low', 'low', 'medium', 'medium', 'high'] as const),
      homeCity: rng.pick(CITIES),
      createdAt: new Date(BASE_TIME - accountAgeDays * DAY),
    };
    bank.customers.push(customer);
    accountOf.set(customer.id, String(rng.int(1_000_000_000, 2_099_999_999)).padStart(10, '0'));
    typicalOf.set(customer.id, rng.int(20, 300) * 10_000); // ₦2,000 to ₦30,000

    const deviceCount = rng.int(1, 3);
    for (let d = 0; d < deviceCount; d++) {
      const firstSeen = BASE_TIME - rng.int(60, Math.min(accountAgeDays, 900)) * DAY;
      const device: SeedDevice = {
        id: id('dev'),
        customerId: customer.id,
        fingerprint: `fp_${Array.from(rng.bytes(8), (b) => b.toString(16).padStart(2, '0')).join('')}`,
        label: rng.pick(DEVICE_LABELS),
        trusted: d === 0 || rng.chance(0.7),
        firstSeenAt: new Date(firstSeen),
        lastSeenAt: new Date(BASE_TIME - rng.int(1, 72) * HOUR),
        lastCity: customer.homeCity,
      };
      bank.devices.push(device);
      if (d === 0) trustedDeviceOf.set(customer.id, device);
    }
  }

  // Helpers that keep ledger and settlement consistent with each transaction
  const addTransaction = (
    input: Omit<SeedTransaction, 'id' | 'reference' | 'currency'>,
    settlement: {
      status: SeedSettlement['status'];
      failureReason?: string;
      settledAfterMinutes?: number;
    },
    debit = true,
  ): SeedTransaction => {
    const txn: SeedTransaction = {
      ...input,
      id: id('txn', input.createdAt.getTime()),
      reference: reference(),
      currency: 'NGN',
    };
    bank.transactions.push(txn);
    if (debit) {
      bank.ledgerEntries.push({
        id: id('led', input.createdAt.getTime()),
        transactionId: txn.id,
        entryType: 'debit',
        accountRef: accountOf.get(txn.customerId)!,
        amountMinor: txn.amountMinor,
        memo: txn.merchantId
          ? `POS/WEB ${bank.merchants.find((m) => m.id === txn.merchantId)!.name.toUpperCase()}`
          : `TRF TO ${(txn.counterpartyName ?? '').toUpperCase()}`,
        postedAt: new Date(txn.createdAt.getTime() + 2_000),
      });
    }
    bank.settlements.push({
      id: id('stl', input.createdAt.getTime()),
      transactionId: txn.id,
      status: settlement.status,
      failureReason: settlement.failureReason ?? null,
      settledAt:
        settlement.status === 'settled'
          ? new Date(txn.createdAt.getTime() + (settlement.settledAfterMinutes ?? 3) * MINUTE)
          : null,
    });
    return txn;
  };

  const cardChannel = (type: TxnType): Channel =>
    type === 'pos' ? 'pos' : type === 'web' ? 'web' : rng.pick(['mobile', 'web'] as const);
  const homeTxn = (customer: SeedCustomer, at: number) => ({
    customerId: customer.id,
    deviceId: trustedDeviceOf.get(customer.id)!.id,
    city: customer.homeCity,
    ipCountry: 'NG',
    createdAt: new Date(at),
  });
  const vary = (typical: number) =>
    BigInt(Math.round((typical * rng.int(60, 140)) / 100 / 100) * 100);

  // Background history: about 8 transactions per customer over the last 60 days
  for (const customer of bank.customers) {
    const typical = typicalOf.get(customer.id)!;
    const count = rng.int(6, 10);
    for (let n = 0; n < count; n++) {
      const at = BASE_TIME - rng.int(2, 60) * DAY - rng.int(0, 12 * 60) * MINUTE;
      if (rng.chance(0.3)) {
        addTransaction(
          {
            ...homeTxn(customer, at),
            merchantId: null,
            counterpartyName: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
            counterpartyBank: rng.pick(BANKS),
            type: 'transfer',
            channel: rng.pick(['mobile', 'ussd'] as const),
            amountMinor: vary(typical),
            status: 'successful',
          },
          { status: 'settled', settledAfterMinutes: 1 },
        );
      } else {
        const type = rng.pick(['card_payment', 'pos', 'web'] as const);
        const failed = rng.chance(0.04);
        addTransaction(
          {
            ...homeTxn(customer, at),
            merchantId: rng.pick(regular).id,
            counterpartyName: null,
            counterpartyBank: null,
            type,
            channel: cardChannel(type),
            amountMinor: vary(typical),
            status: failed ? 'failed' : 'successful',
          },
          failed ? { status: 'failed', failureReason: 'issuer declined' } : { status: 'settled' },
          !failed,
        );
      }
    }
  }

  // Demo cases: 8 per scenario, one customer each
  const demo = (
    scenario: Scenario,
    txn: SeedTransaction,
    reasonCode: DisputeReasonCode,
    customerNotes: string,
    expectedClassifiedType: ClassifiedType,
    expectedDisposition: PolicyDisposition,
  ) =>
    bank.demoCases.push({
      id: `dmo_${String(bank.demoCases.length + 1).padStart(2, '0')}`,
      scenario,
      transactionId: txn.id,
      reasonCode,
      customerNotes,
      expectedClassifiedType,
      expectedDisposition,
      consumedDisputeId: null,
    });
  const customerFor = (index: number) => bank.customers[index]!;

  // 1. Failed transfers: debited, never settled. 6 under the ₦50,000 cap, 2 above.
  const failedAmounts = [
    4_000_000, 1_250_000, 2_500_000, 800_000, 3_500_000, 4_800_000, 9_500_000, 15_000_000,
  ];
  failedAmounts.forEach((amount, i) => {
    const customer = customerFor(i);
    const first = i === 0;
    const pending = !first && i % 3 === 2;
    const txn = addTransaction(
      {
        ...homeTxn(customer, BASE_TIME - rng.int(3, 20) * HOUR),
        merchantId: null,
        counterpartyName: first
          ? 'Owambe Events Ltd'
          : `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
        counterpartyBank: rng.pick(BANKS),
        type: 'transfer',
        channel: first ? 'web' : rng.pick(['mobile', 'ussd'] as const),
        amountMinor: BigInt(amount),
        status: pending ? 'pending' : 'failed',
      },
      pending
        ? { status: 'pending' }
        : {
            status: 'failed',
            failureReason: rng.pick(['beneficiary bank timeout', 'NIP switch error']),
          },
    );
    demo(
      'failed_transfer',
      txn,
      'failed_transfer',
      first
        ? 'I paid 40k by transfer for a festival ticket. The money left my account but the organisers say they never got it.'
        : 'I sent money by transfer and the person says it never arrived, but my account was debited.',
      'failed_transfer_debit',
      amount <= 5_000_000 ? 'auto_resolve' : 'needs_review',
    );
  });

  // 2. Duplicate charges: two identical card payments. 6 seconds-to-minutes apart, 2 hours apart.
  for (let i = 0; i < 8; i++) {
    const customer = customerFor(8 + i);
    const merchant = rng.pick(regular);
    const amount = BigInt(rng.int(15, 400) * 10_000);
    const ambiguous = i >= 6;
    const firstAt = BASE_TIME - rng.int(4, 30) * HOUR;
    const gapMs = ambiguous ? rng.int(3, 6) * HOUR : rng.int(15, 420) * 1000;
    const type = rng.pick(['card_payment', 'pos'] as const);
    const base = {
      merchantId: merchant.id,
      counterpartyName: null,
      counterpartyBank: null,
      type,
      channel: cardChannel(type),
      amountMinor: amount,
      status: 'successful' as const,
    };
    const original = addTransaction(
      { ...homeTxn(customer, firstAt), ...base },
      { status: 'settled' },
    );
    addTransaction({ ...homeTxn(customer, firstAt + gapMs), ...base }, { status: 'settled' });
    demo(
      'duplicate_charge',
      original,
      'duplicate',
      ambiguous
        ? `I was charged twice at ${merchant.name}. Please refund one.`
        : `I paid once at ${merchant.name} but I can see two debits for the same amount.`,
      ambiguous ? 'legitimate_transaction' : 'duplicate_charge',
      ambiguous ? 'needs_review' : 'auto_resolve',
    );
  }

  // 3. Unauthorised: new untrusted device, away from home or abroad, far above typical, new merchant.
  for (let i = 0; i < 8; i++) {
    const customer = customerFor(16 + i);
    const used = new Set(
      bank.transactions.filter((t) => t.customerId === customer.id).map((t) => t.merchantId),
    );
    const merchant = bank.merchants.find((m) => !m.flagged && !used.has(m.id)) ?? rng.pick(regular);
    const at = BASE_TIME - rng.int(2, 18) * HOUR;
    const awayCity = rng.pick(CITIES.filter((c) => c !== customer.homeCity));
    const device: SeedDevice = {
      id: id('dev', at),
      customerId: customer.id,
      fingerprint: `fp_${Array.from(rng.bytes(8), (b) => b.toString(16).padStart(2, '0')).join('')}`,
      label: rng.pick(DEVICE_LABELS),
      trusted: false,
      firstSeenAt: new Date(at - rng.int(5, 90) * MINUTE),
      lastSeenAt: new Date(at),
      lastCity: awayCity,
    };
    bank.devices.push(device);
    const txn = addTransaction(
      {
        customerId: customer.id,
        deviceId: device.id,
        city: awayCity,
        ipCountry: i % 2 === 0 ? rng.pick(FOREIGN_IPS) : 'NG',
        createdAt: new Date(at),
        merchantId: merchant.id,
        counterpartyName: null,
        counterpartyBank: null,
        type: 'web',
        channel: 'web',
        amountMinor: BigInt(Math.round((typicalOf.get(customer.id)! * rng.int(4, 10)) / 100) * 100),
        status: 'successful',
      },
      { status: 'settled' },
    );
    demo(
      'unauthorised',
      txn,
      'unauthorised',
      "I didn't make this payment. I was asleep and my phone was with me.",
      'unauthorised_payment',
      'needs_review',
    );
  }

  // 4. Merchant non-delivery: a settled web payment to a flagged merchant.
  for (let i = 0; i < 8; i++) {
    const customer = customerFor(24 + i);
    const merchant = flagged[i % flagged.length]!;
    const txn = addTransaction(
      {
        ...homeTxn(customer, BASE_TIME - rng.int(5, 14) * DAY),
        merchantId: merchant.id,
        counterpartyName: null,
        counterpartyBank: null,
        type: 'web',
        channel: 'web',
        amountMinor: BigInt(rng.int(80, 450) * 10_000),
        status: 'successful',
      },
      { status: 'settled', settledAfterMinutes: 30 },
    );
    demo(
      'merchant_non_delivery',
      txn,
      'not_delivered',
      `I ordered from ${merchant.name} over a week ago. Nothing was delivered and they stopped answering.`,
      'merchant_non_delivery',
      'needs_review',
    );
  }

  // 5. Legitimate: trusted device, home city, repeat merchant, typical amount; customer says unauthorised.
  for (let i = 0; i < 8; i++) {
    const customer = customerFor(32 + i);
    const merchant = rng.pick(regular);
    const typical = typicalOf.get(customer.id)!;
    for (let p = 0; p < 2; p++) {
      const type = 'card_payment' as const;
      addTransaction(
        {
          ...homeTxn(customer, BASE_TIME - rng.int(10, 50) * DAY),
          merchantId: merchant.id,
          counterpartyName: null,
          counterpartyBank: null,
          type,
          channel: cardChannel(type),
          amountMinor: vary(typical),
          status: 'successful',
        },
        { status: 'settled' },
      );
    }
    const txn = addTransaction(
      {
        ...homeTxn(customer, BASE_TIME - rng.int(6, 40) * HOUR),
        merchantId: merchant.id,
        counterpartyName: null,
        counterpartyBank: null,
        type: 'card_payment',
        channel: 'mobile',
        amountMinor: vary(typical),
        status: 'successful',
      },
      { status: 'settled' },
    );
    demo(
      'legitimate',
      txn,
      'unauthorised',
      `I don't recognise this ${merchant.name} charge.`,
      'legitimate_transaction',
      'needs_review',
    );
  }

  return bank;
}
