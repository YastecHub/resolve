import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const VALID_ID = /^[A-Za-z0-9._-]{1,128}$/;

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && VALID_ID.test(incoming) ? incoming : `req_${randomUUID()}`;
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
}
