import { Global, Module } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AiService],
  exports: [SettingsService, AiService],
})
export class SettingsModule {}
