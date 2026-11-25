import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller.js';

@Module({
  controllers: [DisputesController],
})
export class DisputesModule {}
