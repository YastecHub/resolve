import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.decorators.js';
import { AppException } from '../common/errors/app.exception.js';
import { newId } from '../common/ids.js';
import { Prisma, type Staff } from '../generated/prisma/client.js';
import { PrismaService } from '../infra/prisma.service.js';
import { checkRoleChange } from './role-change.js';
import type { InviteStaffDto, StaffMemberDto, UpdateStaffDto } from './team.dto.js';

const toMember = (s: Staff): StaffMemberDto => ({
  id: s.id,
  staffId: s.staffId,
  name: s.name,
  email: s.email,
  role: s.role,
  status: s.status,
  invitedBy: s.invitedBy,
  createdAt: s.createdAt.toISOString(),
  lastSignInAt: s.lastSignInAt?.toISOString() ?? null,
});

@Injectable()
export class TeamService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(): Promise<StaffMemberDto[]> {
    const rows = await this.prisma.staff.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toMember);
  }

  async invite(body: InviteStaffDto, actor: AuthUser): Promise<StaffMemberDto> {
    for (const field of ['email', 'staffId'] as const) {
      const taken = await this.prisma.staff.findUnique({
        where: { [field]: body[field] } as never,
      });
      if (taken) throw this.taken(field);
    }
    try {
      const [staff] = await this.prisma.$transaction([
        this.prisma.staff.create({
          data: { id: newId('usr'), ...body, status: 'invited', invitedBy: actor.email },
        }),
        this.prisma.accessEvent.create({
          data: {
            id: newId('acc'),
            actorEmail: actor.email,
            action: 'invited',
            targetEmail: body.email,
            detail: body.role,
          },
        }),
      ]);
      return toMember(staff);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = String((error.meta as { target?: unknown } | undefined)?.target ?? '');
        throw this.taken(target.includes('staff_id') ? 'staffId' : 'email');
      }
      throw error;
    }
  }

  async update(id: string, body: UpdateStaffDto, actor: AuthUser): Promise<StaffMemberDto> {
    if ((body.role === undefined) === (body.status === undefined)) {
      throw new AppException(HttpStatus.BAD_REQUEST, {
        code: 'validation_error',
        message: 'The request is invalid.',
        fieldErrors: [{ field: 'role', message: 'Send exactly one of role or status.' }],
      });
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM staff WHERE role = 'admin' FOR UPDATE`;
      const target = await tx.staff.findUnique({ where: { id } });
      if (!target) {
        throw new AppException(HttpStatus.NOT_FOUND, {
          code: 'not_found',
          message: 'That person was not found.',
        });
      }
      const activeAdminCount = await tx.staff.count({ where: { role: 'admin', status: 'active' } });
      const problem = checkRoleChange({
        actorId: actor.id,
        targetId: target.id,
        targetRole: target.role,
        targetStatus: target.status,
        nextRole: body.role,
        nextStatus: body.status,
        activeAdminCount,
      });
      if (problem === 'self_change') {
        throw new AppException(HttpStatus.CONFLICT, {
          code: 'self_change',
          message: "You can't change your own role or suspend yourself.",
        });
      }
      if (problem === 'last_admin') {
        throw new AppException(HttpStatus.CONFLICT, {
          code: 'last_admin',
          message: 'There must always be at least one active admin.',
        });
      }

      let event: {
        action: 'role_changed' | 'suspended' | 'reinstated';
        detail: string | null;
      } | null = null;
      if (body.role && body.role !== target.role) {
        event = { action: 'role_changed', detail: `${target.role} → ${body.role}` };
      } else if (body.status === 'suspended' && target.status !== 'suspended') {
        event = { action: 'suspended', detail: null };
      } else if (body.status === 'active' && target.status === 'suspended') {
        event = { action: 'reinstated', detail: null };
      }
      if (!event) return toMember(target);

      // Reinstating someone who never signed in puts them back to invited.
      const status =
        body.status === 'active'
          ? target.lastSignInAt
            ? 'active'
            : 'invited'
          : (body.status ?? target.status);
      const updated = await tx.staff.update({
        where: { id },
        data: { role: body.role ?? target.role, status },
      });
      await tx.accessEvent.create({
        data: { id: newId('acc'), actorEmail: actor.email, targetEmail: target.email, ...event },
      });
      return toMember(updated);
    });
  }

  private taken(field: 'email' | 'staffId') {
    return new AppException(HttpStatus.CONFLICT, {
      code: 'conflict',
      message:
        field === 'email'
          ? 'Someone already uses that email.'
          : 'Someone already has that staff ID.',
      details: { field },
    });
  }
}
