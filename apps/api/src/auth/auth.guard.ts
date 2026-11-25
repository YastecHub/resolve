import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { can, type Permission } from '../common/domain.js';
import { AppException } from '../common/errors/app.exception.js';
import { PrismaService } from '../infra/prisma.service.js';
import { authSecret } from './auth.config.js';
import { IS_PUBLIC, REQUIRED_PERMISSION, type AuthedRequest } from './auth.decorators.js';
import { verifyToken } from './token.js';

export const unauthorized = () =>
  new AppException(HttpStatus.UNAUTHORIZED, {
    code: 'unauthorized',
    message: 'Sign in to continue.',
  });

export const forbidden = (message = "Your role doesn't allow this.") =>
  new AppException(HttpStatus.FORBIDDEN, { code: 'forbidden', message });

/**
 * Verifies the bearer token, then loads the staff row on every request so a
 * suspension or role change applies immediately. Then checks the route's permission.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    const claims = match ? verifyToken(match[1]!.trim(), authSecret()) : null;
    if (!claims) throw unauthorized();

    const staff = await this.prisma.staff.findUnique({ where: { id: claims.sub } });
    if (!staff) throw unauthorized();
    if (staff.status === 'suspended') throw forbidden('This account is suspended.');

    req.user = {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      staffId: staff.staffId,
      role: staff.role,
    };

    const permission = this.reflector.getAllAndOverride<Permission | undefined>(
      REQUIRED_PERMISSION,
      targets,
    );
    if (permission && !can(staff.role, permission)) throw forbidden();
    return true;
  }
}
