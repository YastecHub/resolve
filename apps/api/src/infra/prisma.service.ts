import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        connectionTimeoutMillis: 2_000,
      }),
    });
  }

  async ping(): Promise<void> {
    await this.$queryRaw`select 1`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
