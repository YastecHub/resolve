import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DisputesModule } from './disputes/disputes.module.js';
import { HealthModule } from './health/health.module.js';
import { InfraModule } from './infra/infra.module.js';

@Module({
  imports: [
    InfraModule,
    AuthModule,
    HealthModule,
    DisputesModule,
  ],
})
export class AppModule {}
