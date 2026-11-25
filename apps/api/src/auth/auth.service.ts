import { HttpStatus, Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ROLE_PERMISSIONS } from '../common/domain.js';
import { AppException } from '../common/errors/app.exception.js';
import { newId } from '../common/ids.js';
import { PrismaService } from '../infra/prisma.service.js';
import { authSecret, TOKEN_TTL_SECONDS } from './auth.config.js';
import type { AuthUser } from './auth.decorators.js';
import { forbidden } from './auth.guard.js';
import { ensureBootstrapAdmin } from './bootstrap.js';
import type { MeDto, SignInDto, SignInResultDto } from './dto/auth.dto.js';
import { signToken } from './token.js';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger('AuthService');

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      if (await ensureBootstrapAdmin(this.prisma)) this.logger.log('Created the bootstrap admin.');
    } catch (error) {
      // The database may not be migrated yet; the seed covers this case too.
      this.logger.warn(`Skipped the bootstrap admin: ${(error as Error).message}`);
    }
  }

  async signIn({ email, staffId }: SignInDto): Promise<SignInResultDto> {
    const staff = await this.prisma.staff.findUnique({ where: { email } });
    if (!staff || staff.staffId !== staffId) {
      throw new AppException(HttpStatus.UNAUTHORIZED, {
        code: 'unauthorized',
        message: "That email and staff ID don't match an account.",
      });
    }
    if (staff.status === 'suspended') throw forbidden('This account is suspended.');

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.staff.update({
        where: { id: staff.id },
        data: { status: 'active', lastSignInAt: now },
      }),
      ...(staff.status === 'invited'
        ? [
            this.prisma.accessEvent.create({
              data: {
                id: newId('acc'),
                actorEmail: staff.email,
                action: 'first_sign_in',
                targetEmail: staff.email,
              },
            }),
          ]
        : []),
    ]);

    const { token, expiresAt } = signToken(staff.id, authSecret(), TOKEN_TTL_SECONDS);
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        staffId: staff.staffId,
        role: staff.role,
      },
    };
  }

  async me(user: AuthUser): Promise<MeDto> {
    const staff = await this.prisma.staff.findUniqueOrThrow({ where: { id: user.id } });
    return {
      ...user,
      permissions: [...ROLE_PERMISSIONS[user.role]],
      lastSignInAt: staff.lastSignInAt?.toISOString() ?? null,
    };
  }
}
