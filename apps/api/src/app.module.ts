import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DisputesModule } from './disputes/disputes.module.js';
import { HealthModule } from './health/health.module.js';
import { InfraModule } from './infra/infra.module.js';
import { InvestigationsModule } from './investigations/investigations.module.js';
import { SettingsModule } from './settings/settings.module.js';

@Module({
  imports: [
    InfraModule,
    SettingsModule,
    InvestigationsModule,
    AuthModule,
    HealthModule,
    DisputesModule,
  ],
})
export class AppModule {}
