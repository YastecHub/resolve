import { HttpException, HttpStatus } from '@nestjs/common';

export interface FieldError {
  field: string;
  message: string;
}

export interface AppErrorBody {
  code: string;
  message: string;
  fieldErrors?: FieldError[];
  details?: Record<string, unknown>;
}

export class AppException extends HttpException {
  constructor(status: HttpStatus, body: AppErrorBody) {
    super(body, status);
  }

  static notImplemented(feature: string) {
    return new AppException(HttpStatus.NOT_IMPLEMENTED, {
      code: 'not_implemented',
      message: `${feature} is not implemented yet.`,
    });
  }
}
