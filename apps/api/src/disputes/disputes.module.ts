import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service.js';
import { DisputesController } from './disputes.controller.js';
import { DisputesService } from './disputes.service.js';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService, ActionsService],
  exports: [DisputesService],
})
export class DisputesModule {}
