import { Module } from '@nestjs/common';
import { DisputesModule } from '../disputes/disputes.module.js';
import { DemoController } from './demo.controller.js';
import { DemoService } from './demo.service.js';

@Module({ imports: [DisputesModule], controllers: [DemoController], providers: [DemoService] })
export class DemoModule {}
