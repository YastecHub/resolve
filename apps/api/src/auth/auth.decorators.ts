import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Permission, StaffRole } from '../common/domain.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  staffId: string;
  role: StaffRole;
}

export type AuthedRequest = Request & { user?: AuthUser };

export const IS_PUBLIC = 'auth:public';
export const REQUIRED_PERMISSION = 'auth:permission';

/** No token needed. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The signed-in person's role must grant this permission. */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRED_PERMISSION, permission);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  return req.user;
});
