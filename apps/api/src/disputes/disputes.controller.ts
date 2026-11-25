import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type AuthUser } from '../auth/auth.decorators.js';
import { AuditWriter } from '../audit/audit.writer.js';
import { CaseFilesService } from '../casefiles/casefiles.service.js';
import { InvestigationService } from '../investigations/investigation.service.js';
import { CaseFileDto, ChainVerificationDto, TraceDto, TraceQueryDto } from '../trace/trace.dto.js';
import { toTraceStep } from '../trace/trace.mapper.js';
import { ActionsService } from './actions.service.js';
import { toInvestigationSummary } from './dispute.mapper.js';
import { notFound } from './disputes.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import {
  ApproveDisputeDto,
  EditMessageDto,
  EscalateDisputeDto,
  OverrideDisputeDto,
} from './dto/action.dto.js';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import type { Paginated } from '../common/envelope.js';
import { DisputesService } from './disputes.service.js';
import {
  CreateDisputeDto,
  DisputeDetailDto,
  DisputeListItemDto,
  DisputeListMetaDto,
  DisputeSummaryDto,
  ListDisputesQueryDto,
} from './dto/dispute.dto.js';

@ApiTags('disputes')
@ApiBearerAuth()
@ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
@ApiFailure(HttpStatus.FORBIDDEN, 'The role lacks the permission (`forbidden`).')
@Controller('disputes')
export class DisputesController {
  constructor(
    @Inject(DisputesService) private readonly disputes: DisputesService,
    @Inject(ActionsService) private readonly actions: ActionsService,
    @Inject(InvestigationService) private readonly investigations: InvestigationService,
    @Inject(AuditWriter) private readonly audit: AuditWriter,
    @Inject(CaseFilesService) private readonly caseFiles: CaseFilesService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermission('cases.act')
  @ApiOperation({
    operationId: 'createDispute',
    summary: 'File a dispute',
    description:
      'Opens a dispute against a transaction and queues it for investigation. One open dispute per transaction.',
  })
  @ApiSuccess(DisputeSummaryDto, {
    status: HttpStatus.CREATED,
    description: 'Dispute created and queued.',
  })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'The transaction does not exist (`not_found`).')
  @ApiFailure(
    HttpStatus.CONFLICT,
    'The transaction already has an open dispute (`conflict`); `details.disputeId` is the open one.',
  )
  async create(@Body() body: CreateDisputeDto): Promise<DisputeSummaryDto> {
    const dispute = await this.disputes.create(body);
    await this.investigations.enqueue(dispute.id);
    return dispute;
  }

  @Get()
  @RequirePermission('cases.view')
  @ApiOperation({
    operationId: 'listDisputes',
    summary: 'List disputes',
    description:
      'Paged and filterable. Pagination and `countsByStatus` (for the status tabs) are in `meta`.',
  })
  @ApiSuccess(DisputeListItemDto, {
    paginated: true,
    metaModel: DisputeListMetaDto,
    description: 'A page of disputes.',
  })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'A query parameter is invalid (`validation_error`).')
  list(@Query() query: ListDisputesQueryDto): Promise<Paginated<DisputeListItemDto>> {
    return this.disputes.list(query);
  }

  @Get(':id')
  @RequirePermission('cases.view')
  @ApiOperation({
    operationId: 'getDispute',
    summary: 'Get a dispute',
    description:
      'The dispute with its transaction, customer, latest investigation and analyst actions.',
  })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDetailDto, { description: 'The dispute.' })
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  get(@Param('id') id: string): Promise<DisputeDetailDto> {
    return this.disputes.detail(id);
  }

  @Get(':id/trace')
  @RequirePermission('cases.view')
  @ApiOperation({
    operationId: 'getDisputeTrace',
    summary: 'Live investigation trace',
    description:
      'Steps of the latest investigation after `afterSeq`. Poll about every 1.5 s until `done` is true.',
  })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(TraceDto, { description: 'New steps since `afterSeq`.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'A query parameter is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  async trace(@Param('id') id: string, @Query() query: TraceQueryDto): Promise<TraceDto> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      select: { latestInvestigation: true },
    });
    if (!dispute) throw notFound('The dispute');
    const investigation = dispute.latestInvestigation;
    if (!investigation) return { investigation: null, steps: [], done: false };
    const steps = await this.audit.listSteps(investigation.id, query.afterSeq);
    return {
      investigation: toInvestigationSummary(investigation),
      steps: steps.map(toTraceStep),
      done: investigation.status !== 'running',
    };
  }

  @Get(':id/verify')
  @RequirePermission('cases.view')
  @ApiOperation({
    operationId: 'verifyDisputeChain',
    summary: 'Verify the audit chain',
    description: 'Recomputes the hash chain of the latest investigation.',
  })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(ChainVerificationDto, { description: 'The verification result.' })
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute, or it has no investigation yet (`not_found`).')
  async verify(@Param('id') id: string): Promise<ChainVerificationDto> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      select: { latestInvestigationId: true },
    });
    if (!dispute?.latestInvestigationId) throw notFound('An investigation for this dispute');
    return this.audit.verify(dispute.latestInvestigationId);
  }

  @Get(':id/case-file')
  @RequirePermission('cases.view')
  @ApiOperation({
    operationId: 'getDisputeCaseFile',
    summary: 'The case file',
    description:
      'Everything about the dispute in one JSON document. Add `?download=1` to get it as an attachment.',
  })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(CaseFileDto, { description: 'The case file.' })
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  async caseFile(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CaseFileDto> {
    const file = await this.caseFiles.read(id);
    if (!file) throw notFound('The dispute');
    if (download === '1')
      res.setHeader('Content-Disposition', `attachment; filename="${file.dispute.id}.json"`);
    return file;
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('cases.act')
  @ApiOperation({
    operationId: 'approveDispute',
    summary: "Approve the agent's recommendation",
    description:
      'Runs the recommended action. A recommendation of `none` rejects the dispute. Not available when the agent recommended manual review.',
  })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDetailDto, { description: 'The updated dispute.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  @ApiFailure(HttpStatus.CONFLICT, 'Not allowed from the current status (`invalid_state`).')
  approve(@Param('id') id: string, @Body() body: ApproveDisputeDto, @CurrentUser() user: AuthUser) {
    return this.actions.approve(id, body, user);
  }

  @Post(':id/override')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('cases.act')
  @ApiOperation({
    operationId: 'overrideDispute',
    summary: 'Override with a different action',
    description: 'Runs the chosen action with a written reason. `none` rejects the dispute.',
  })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDetailDto, { description: 'The updated dispute.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  @ApiFailure(HttpStatus.CONFLICT, 'Not allowed from the current status (`invalid_state`).')
  override(
    @Param('id') id: string,
    @Body() body: OverrideDisputeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.actions.override(id, body, user);
  }

  @Post(':id/escalate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('cases.act')
  @ApiOperation({ operationId: 'escalateDispute', summary: 'Escalate a dispute' })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDetailDto, { description: 'The updated dispute.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  @ApiFailure(HttpStatus.CONFLICT, 'Not allowed from the current status (`invalid_state`).')
  escalate(
    @Param('id') id: string,
    @Body() body: EscalateDisputeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.actions.escalate(id, body, user);
  }

  @Patch(':id/message')
  @RequirePermission('cases.act')
  @ApiOperation({ operationId: 'editDisputeMessage', summary: 'Edit the customer message' })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDetailDto, { description: 'The updated dispute.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  @ApiFailure(
    HttpStatus.CONFLICT,
    'The dispute is finished or has no message yet (`invalid_state`).',
  )
  editMessage(
    @Param('id') id: string,
    @Body() body: EditMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.actions.editMessage(id, body, user);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('cases.act')
  @ApiOperation({ operationId: 'retryDispute', summary: 'Retry a failed investigation' })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDetailDto, { description: 'The dispute, queued again.' })
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  @ApiFailure(HttpStatus.CONFLICT, 'Only failed disputes can be retried (`invalid_state`).')
  retry(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.actions.retry(id, user);
  }
}
