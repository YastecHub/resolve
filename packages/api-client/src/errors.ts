export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorInit {
  fieldErrors?: FieldError[];
  details?: unknown;
  requestId?: string;
}

export class ApiError extends Error {
  readonly fieldErrors: FieldError[];
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    init: ApiErrorInit = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.fieldErrors = init.fieldErrors ?? [];
    this.details = init.details;
    this.requestId = init.requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
