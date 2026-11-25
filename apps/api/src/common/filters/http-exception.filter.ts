import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AppErrorBody } from '../errors/app.exception.js';
import { requestMeta } from '../envelope.js';

const CODE_BY_STATUS: Record<number, string> = {
  400: 'validation_error',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  429: 'rate_limited',
  501: 'not_implemented',
  503: 'service_unavailable',
};

function toErrorBody(exception: HttpException): AppErrorBody {
  const status = exception.getStatus();
  const response = exception.getResponse();
  if (typeof response === 'object' && response !== null && 'code' in response) {
    return response as AppErrorBody;
  }
  const message =
    typeof response === 'string'
      ? response
      : String((response as { message?: unknown }).message ?? exception.message);
  return { code: CODE_BY_STATUS[status] ?? 'error', message };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const meta = requestMeta(req);

    if (exception instanceof HttpException) {
      res
        .status(exception.getStatus())
        .json({ success: false, error: toErrorBody(exception), meta });
      return;
    }

    this.logger.error(
      JSON.stringify({ msg: 'unhandled error', requestId: meta.requestId, path: req.path }),
      exception instanceof Error ? exception.stack : undefined,
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'internal_error', message: 'Something went wrong on our side. Try again.' },
      meta,
    });
  }
}
