import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DemoModule } from './demo/demo.module.js';
import { DisputesModule } from './disputes/disputes.module.js';
import { HealthModule } from './health/health.module.js';
import { InfraModule } from './infra/infra.module.js';
import { InvestigationsModule } from './investigations/investigations.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { TeamModule } from './team/team.module.js';

@Module({
  imports: [
    InfraModule,
    SettingsModule,
    InvestigationsModule,
    AuthModule,
    HealthModule,
    DisputesModule,
    MetricsModule,
    TeamModule,
    DemoModule,
  ],
})
export class AppModule {}
