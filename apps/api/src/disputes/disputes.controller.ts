import { Body, Controller, Get, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../auth/auth.decorators.js';
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
  constructor(@Inject(DisputesService) private readonly disputes: DisputesService) {}

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
  create(@Body() body: CreateDisputeDto): Promise<DisputeSummaryDto> {
    return this.disputes.create(body);
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
}
