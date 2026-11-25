import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { AppException } from '../common/errors/app.exception.js';
import type { Paginated } from '../common/envelope.js';
import { CreateDisputeDto, DisputeDto, ListDisputesQueryDto } from './dto/dispute.dto.js';

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  @Post()
  @ApiOperation({
    operationId: 'createDispute',
    summary: 'File a dispute',
    description:
      'Opens a dispute against a transaction and queues it for investigation. One open dispute per transaction.',
  })
  @ApiSuccess(DisputeDto, {
    status: HttpStatus.CREATED,
    description: 'Dispute created and queued.',
  })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'The transaction does not exist (`not_found`).')
  @ApiFailure(HttpStatus.CONFLICT, 'The transaction already has an open dispute (`conflict`).')
  create(@Body() body: CreateDisputeDto): DisputeDto {
    void body;
    throw AppException.notImplemented('Filing a dispute');
  }

  @Get()
  @ApiOperation({
    operationId: 'listDisputes',
    summary: 'List disputes',
    description: 'Paged list, newest first. Pagination is in `meta`.',
  })
  @ApiSuccess(DisputeDto, { paginated: true, description: 'A page of disputes.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'A query parameter is invalid (`validation_error`).')
  list(@Query() query: ListDisputesQueryDto): Paginated<DisputeDto> {
    void query;
    throw AppException.notImplemented('Listing disputes');
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getDispute', summary: 'Get a dispute' })
  @ApiParam({ name: 'id', example: 'dsp_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(DisputeDto, { description: 'The dispute.' })
  @ApiFailure(HttpStatus.NOT_FOUND, 'No dispute with that ID (`not_found`).')
  get(@Param('id') id: string): DisputeDto {
    void id;
    throw AppException.notImplemented('Getting a dispute');
  }
}
