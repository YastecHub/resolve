import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../auth/auth.decorators.js';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { MetricsDto } from './metrics.dto.js';
import { MetricsService } from './metrics.service.js';

@ApiTags('metrics')
@ApiBearerAuth()
@Controller('metrics')
export class MetricsController {
  constructor(@Inject(MetricsService) private readonly metrics: MetricsService) {}

  @Get()
  @RequirePermission('cases.view')
  @ApiOperation({ operationId: 'getMetrics', summary: 'Queue and agent metrics for the overview' })
  @ApiSuccess(MetricsDto, { description: 'The current metrics.' })
  @ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
  @ApiFailure(HttpStatus.FORBIDDEN, 'The role lacks the permission (`forbidden`).')
  get(): Promise<MetricsDto> {
    return this.metrics.get();
  }
}
