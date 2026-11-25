import type { Request } from 'express';

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta & Partial<Omit<Paginated<unknown>, 'items'>>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  /** Extra list-level fields, merged into `meta` (for example `countsByStatus`). */
  extraMeta?: Record<string, unknown>;
}

export function requestMeta(req: Request): ResponseMeta {
  return {
    requestId: String(req.headers['x-request-id'] ?? ''),
    timestamp: new Date().toISOString(),
  };
}

export function isPaginated(value: unknown): value is Paginated<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Paginated<unknown>).items) &&
    typeof (value as Paginated<unknown>).total === 'number'
  );
}
