import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { AppException } from '../common/errors/app.exception.js';
import { HealthReportDto } from './dto/health.dto.js';
import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    operationId: 'getHealth',
    summary: 'Service health',
    description:
      'Checks the API, PostgreSQL and Redis. Returns 200 when everything is up and 503 with the full report in `error.details` when anything is down.',
  })
  @ApiSuccess(HealthReportDto, { description: 'Every dependency is up.' })
  @ApiFailure(
    HttpStatus.SERVICE_UNAVAILABLE,
    'A dependency is down (`service_unavailable`). The report is in `error.details`.',
  )
  async get(): Promise<HealthReportDto> {
    const report = await this.health.report();
    if (report.status !== 'ok') {
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, {
        code: 'service_unavailable',
        message: 'One or more dependencies are down.',
        details: { ...report },
      });
    }
    return report;
  }
}
