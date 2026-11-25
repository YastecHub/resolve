import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 2_000,
  });

  async ping(): Promise<void> {
    await this.pool.query('select 1');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
