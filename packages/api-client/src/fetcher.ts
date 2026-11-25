import { ApiError, type FieldError } from './errors';

export type ErrorType<E = unknown> = ApiError & { readonly body?: E };
export type BodyType<Body> = Body;

interface FailureEnvelope {
  success: false;
  error?: { code?: unknown; message?: unknown; fieldErrors?: unknown; details?: unknown };
  meta?: { requestId?: unknown };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(res: Response, body: unknown): ApiError {
  const envelope = body as FailureEnvelope | undefined;
  const error = envelope?.error;
  return new ApiError(
    res.status,
    asString(error?.code) ?? 'http_error',
    asString(error?.message) ?? (res.statusText || `Request failed with status ${res.status}`),
    {
      fieldErrors: Array.isArray(error?.fieldErrors) ? (error.fieldErrors as FieldError[]) : [],
      details: error?.details,
      requestId:
        asString(envelope?.meta?.requestId) ?? res.headers.get('x-request-id') ?? undefined,
    },
  );
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && options.body !== null && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (!headers.has('accept')) headers.set('accept', 'application/json');

  let res: Response;
  try {
    res = await fetch(url, { credentials: 'include', ...options, headers });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(
      0,
      'network_error',
      'The server could not be reached. Check your connection and try again.',
    );
  }

  const body = await readBody(res);
  if (!res.ok) throw toApiError(res, body);
  return body as T;
}

export default apiFetch;
