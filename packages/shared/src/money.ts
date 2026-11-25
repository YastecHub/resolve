const KOBO_PER_NAIRA = 100;

function assertMinor(minor: number): void {
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`amount_minor must be a safe integer, received ${minor}`);
  }
}

export function nairaToMinor(naira: number): number {
  if (!Number.isFinite(naira)) {
    throw new RangeError(`naira must be a finite number, received ${naira}`);
  }
  const minor = Math.round(Number((Math.abs(naira) * KOBO_PER_NAIRA).toPrecision(15)));
  return naira < 0 ? -minor : minor;
}

export function minorToNaira(minor: number): number {
  assertMinor(minor);
  return minor / KOBO_PER_NAIRA;
}

export function formatNaira(minor: number): string {
  assertMinor(minor);
  const negative = minor < 0;
  const abs = BigInt(Math.abs(minor));
  const whole = (abs / BigInt(KOBO_PER_NAIRA)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (abs % BigInt(KOBO_PER_NAIRA)).toString().padStart(2, '0');
  return `${negative ? '-' : ''}₦${whole}.${fraction}`;
}
