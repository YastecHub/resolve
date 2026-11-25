import { Module } from '@nestjs/common';
import { AuditController } from '../audit/audit.controller.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsService } from './metrics.service.js';

@Module({ controllers: [MetricsController, AuditController], providers: [MetricsService] })
export class MetricsModule {}
