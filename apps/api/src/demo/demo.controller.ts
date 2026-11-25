import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type AuthUser } from '../auth/auth.decorators.js';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { EvalDto, OkDto, SubmitDemoDto, SubmitDemoResultDto } from './demo.dto.js';
import { DemoService } from './demo.service.js';

@ApiTags('demo')
@ApiBearerAuth()
@ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
@ApiFailure(HttpStatus.FORBIDDEN, 'The role lacks the permission (`forbidden`).')
@RequirePermission('demo.use')
@Controller('demo')
export class DemoController {
  constructor(@Inject(DemoService) private readonly demo: DemoService) {}

  @Post('submit')
  @ApiOperation({ operationId: 'submitDemoCases', summary: 'File seeded demo cases as disputes' })
  @ApiSuccess(SubmitDemoResultDto, {
    status: HttpStatus.CREATED,
    description: 'Disputes filed and queued.',
  })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  submit(@Body() body: SubmitDemoDto): Promise<SubmitDemoResultDto> {
    return this.demo.submit(body);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'resetDemo',
    summary: 'Reset the demo data',
    description:
      'Deletes every dispute and its audit trail, then re-seeds the bank. Staff and settings are kept.',
  })
  @ApiSuccess(OkDto, { description: 'Reset.' })
  reset(@CurrentUser() user: AuthUser): Promise<{ ok: true }> {
    return this.demo.reset(user);
  }

  @Get('eval')
  @ApiOperation({ operationId: 'getDemoEval', summary: 'Accuracy of the agent on the demo cases' })
  @ApiSuccess(EvalDto, { description: 'Per-case results and the summary.' })
  evaluate(): Promise<EvalDto> {
    return this.demo.evaluate();
  }
}
