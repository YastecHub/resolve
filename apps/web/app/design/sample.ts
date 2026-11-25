import {
  CLASSIFIED_TYPES,
  DISPUTE_STATUSES,
  type ClassifiedType,
  type DisputeStatus,
} from '@resolve/shared';

export const STATUSES: readonly DisputeStatus[] = DISPUTE_STATUSES;
export const TYPES: readonly ClassifiedType[] = CLASSIFIED_TYPES;

export const NOW = Date.now();
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export const SAMPLE_IDS = {
  dispute: 'dsp_01J8K2M4Q7X9V3N5R6T8W0Y7F2A',
  step: 'stp_01J8K2M4Q7X9V3N5R6T8W0Y7F2A',
};

export const AREA_DATA = Array.from({ length: 24 }, (_, hour) => ({
  label: `${String(hour).padStart(2, '0')}:00`,
  value: Math.round(6 + 5 * Math.sin(hour / 3.2) + (hour > 8 && hour < 18 ? 9 : 0) + (hour % 5)),
}));

export const SPARK_DATA = [4, 6, 5, 8, 7, 11, 9, 13, 12, 16] as const;

export const STACK_SEGMENTS = [
  { key: 'auto', label: 'Auto-resolved', tone: 'success' },
  { key: 'review', label: 'Needs review', tone: 'warning' },
  { key: 'escalated', label: 'Escalated', tone: 'info' },
  { key: 'rejected', label: 'Rejected', tone: 'neutral' },
  { key: 'failed', label: 'Failed', tone: 'danger' },
] as const;

export const STACK_ROWS = [
  { label: 'Failed transfer', values: { auto: 18, review: 3, escalated: 1 } },
  { label: 'Duplicate charge', values: { auto: 12, review: 2, rejected: 1 } },
  { label: 'Unauthorised', values: { review: 9, escalated: 3, failed: 1 } },
  { label: 'Non-delivery', values: { review: 5, rejected: 2 } },
  { label: 'Legitimate', values: { rejected: 4, auto: 1 } },
] as const;
