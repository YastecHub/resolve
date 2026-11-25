import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import { isPaginated, requestMeta, type SuccessEnvelope } from '../envelope.js';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessEnvelope<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      map((body: unknown) => {
        const meta = requestMeta(req);
        if (isPaginated(body)) {
          const { items, page, pageSize, total, extraMeta } = body;
          return {
            success: true,
            data: items,
            meta: { ...extraMeta, ...meta, page, pageSize, total },
          };
        }
        return { success: true, data: body ?? null, meta };
      }),
    );
  }
}
