import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AiService } from '../ai/ai.service.js';
import { AiProfileDto, AiProfileTestDto } from '../ai/dto/ai.dto.js';
import { CurrentUser, RequirePermission, type AuthUser } from '../auth/auth.decorators.js';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { SettingsDto, UpdateSettingsDto } from './dto/settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('config')
@ApiBearerAuth()
@ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
@ApiFailure(HttpStatus.FORBIDDEN, 'The role lacks the permission (`forbidden`).')
@Controller('config')
export class SettingsController {
  constructor(
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(AiService) private readonly ai: AiService,
  ) {}

  @Get()
  @RequirePermission('cases.view')
  @ApiOperation({ operationId: 'getConfig', summary: 'Policy, agent and AI settings' })
  @ApiSuccess(SettingsDto, { description: 'The current settings, defaults filled in.' })
  get(): Promise<SettingsDto> {
    return this.settings.get();
  }

  @Put()
  @RequirePermission('settings.edit')
  @ApiOperation({
    operationId: 'updateConfig',
    summary: 'Change settings',
    description: 'Partial update: send only the fields to change. Returns the full settings.',
  })
  @ApiSuccess(SettingsDto, { description: 'The updated settings.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'A value is invalid (`validation_error`).')
  update(@Body() body: UpdateSettingsDto, @CurrentUser() user: AuthUser): Promise<SettingsDto> {
    return this.settings.update(body, user.email);
  }

  @Get('ai-profiles')
  @RequirePermission('cases.view')
  @ApiOperation({ operationId: 'listAiProfiles', summary: 'Configured AI profiles' })
  @ApiSuccess(AiProfileDto, { isArray: true, description: 'Every configured profile.' })
  async profiles(): Promise<AiProfileDto[]> {
    const { ai } = await this.settings.get();
    return this.ai.list(ai.activeProfile);
  }

  @Post('ai-profiles/:name/test')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('settings.edit')
  @ApiParam({ name: 'name', example: 'hosted' })
  @ApiOperation({
    operationId: 'testAiProfile',
    summary: 'Test an AI profile',
    description: 'Sends a one-token completion. A failed test still returns 200 with `ok: false`.',
  })
  @ApiSuccess(AiProfileTestDto, { description: 'The test ran.' })
  @ApiFailure(HttpStatus.NOT_FOUND, 'No profile with that name (`not_found`).')
  test(@Param('name') name: string): Promise<AiProfileTestDto> {
    return this.ai.test(name);
  }
}
