import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { buildOpenApi, configureApp } from './setup.js';

const out = resolve(process.argv[2] ?? 'openapi.json');
const app = await NestFactory.create(AppModule, { logger: false });
configureApp(app);
const document = buildOpenApi(app);
document.info.version = '1.0.0';
writeFileSync(out, `${JSON.stringify(document, null, 2)}\n`);
await app.close();
console.log(`Wrote ${out}`);
