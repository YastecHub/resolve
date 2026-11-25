import { Controller, Get, HttpStatus, Inject, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../auth/auth.decorators.js';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { PageQueryDto } from '../common/dto/page-query.dto.js';
import type { Paginated } from '../common/envelope.js';
import { toAnalystAction } from '../disputes/dispute.mapper.js';
import { PrismaService } from '../infra/prisma.service.js';
import { AccessAuditDto, ActionAuditDto, InvestigationAuditDto } from './dto/audit.dto.js';

const page = (q: PageQueryDto) => ({ skip: (q.page - 1) * q.pageSize, take: q.pageSize });

@ApiTags('audit')
@ApiBearerAuth()
@ApiFailure(HttpStatus.BAD_REQUEST, 'A query parameter is invalid (`validation_error`).')
@ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
@ApiFailure(HttpStatus.FORBIDDEN, 'The role lacks the permission (`forbidden`).')
@RequirePermission('audit.view')
@Controller('audit')
export class AuditController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('investigations')
  @ApiOperation({
    operationId: 'listInvestigationAudit',
    summary: 'Every investigation, newest first',
  })
  @ApiSuccess(InvestigationAuditDto, { paginated: true, description: 'A page of investigations.' })
  async investigations(@Query() q: PageQueryDto): Promise<Paginated<InvestigationAuditDto>> {
    const [rows, total] = await Promise.all([
      this.prisma.investigation.findMany({
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        ...page(q),
      }),
      this.prisma.investigation.count(),
    ]);
    return {
      items: rows.map((i) => ({
        id: i.id,
        disputeId: i.disputeId,
        model: i.model,
        profile: i.profile,
        providerKind: i.providerKind,
        stepsCount: i.stepsCount,
        durationMs: i.finishedAt ? i.finishedAt.getTime() - i.startedAt.getTime() : null,
        status: i.status,
        startedAt: i.startedAt.toISOString(),
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }

  @Get('actions')
  @ApiOperation({ operationId: 'listActionAudit', summary: 'Every analyst action, newest first' })
  @ApiSuccess(ActionAuditDto, { paginated: true, description: 'A page of analyst actions.' })
  async actions(@Query() q: PageQueryDto): Promise<Paginated<ActionAuditDto>> {
    const [rows, total] = await Promise.all([
      this.prisma.analystAction.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...page(q),
      }),
      this.prisma.analystAction.count(),
    ]);
    return {
      items: rows.map((a) => ({ ...toAnalystAction(a), disputeId: a.disputeId })),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }

  @Get('access')
  @ApiOperation({ operationId: 'listAccessAudit', summary: 'Every access change, newest first' })
  @ApiSuccess(AccessAuditDto, { paginated: true, description: 'A page of access events.' })
  async access(@Query() q: PageQueryDto): Promise<Paginated<AccessAuditDto>> {
    const [rows, total] = await Promise.all([
      this.prisma.accessEvent.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...page(q),
      }),
      this.prisma.accessEvent.count(),
    ]);
    return {
      items: rows.map((e) => ({
        id: e.id,
        actorEmail: e.actorEmail,
        action: e.action,
        targetEmail: e.targetEmail,
        detail: e.detail,
        createdAt: e.createdAt.toISOString(),
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }
}
