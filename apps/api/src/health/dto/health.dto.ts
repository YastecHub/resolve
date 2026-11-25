import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckResultDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  status!: 'up' | 'down';

  @ApiProperty({ description: 'How long the check took, in milliseconds.', example: 3 })
  latencyMs!: number;

  @ApiPropertyOptional({ description: 'Why the check failed.', example: 'connection refused' })
  error?: string;
}

export class HealthChecksDto {
  @ApiProperty({ type: CheckResultDto })
  api!: CheckResultDto;

  @ApiProperty({ type: CheckResultDto, description: 'PostgreSQL.' })
  database!: CheckResultDto;

  @ApiProperty({ type: CheckResultDto })
  redis!: CheckResultDto;
}

export class HealthReportDto {
  @ApiProperty({ enum: ['ok', 'degraded'], example: 'ok' })
  status!: 'ok' | 'degraded';

  @ApiProperty({ example: 'resolve-api' })
  service!: 'resolve-api';

  @ApiProperty({ description: 'Deployed version (commit SHA in production).', example: '3f9c1a2' })
  version!: string;

  @ApiProperty({ example: 3600 })
  uptimeSeconds!: number;

  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' })
  time!: string;

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;
}
