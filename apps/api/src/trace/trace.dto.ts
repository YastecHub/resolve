import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { DisputeDetailDto, InvestigationSummaryDto } from '../disputes/dto/dispute.dto.js';

export class TraceQueryDto {
  @ApiPropertyOptional({
    minimum: 0,
    default: 0,
    description: 'Only steps after this sequence number.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  afterSeq: number = 0;
}

export class TraceStepDto {
  @ApiProperty({ example: 'stp_01JD8Q6B…' }) id!: string;
  @ApiProperty({ example: 3 }) seq!: number;
  @ApiProperty({ enum: ['model', 'tool', 'system'], example: 'tool' }) kind!:
    'model' | 'tool' | 'system';
  @ApiProperty({ nullable: true, type: String, example: 'get_settlement_status' }) toolName!:
    string | null;
  @ApiProperty({ example: 'Get settlement status' }) title!: string;
  @ApiProperty({ example: 'Settlement failed: beneficiary bank timeout, 182 minutes ago' })
  summary!: string;
  @ApiProperty({ example: true }) ok!: boolean;
  @ApiProperty({ type: 'object', additionalProperties: true }) input!: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true }) output!: Record<string, unknown>;
  @ApiProperty({ example: 41 }) latencyMs!: number;
  @ApiProperty({ example: '9b1f…' }) prevHash!: string;
  @ApiProperty({ example: 'e8d2…' }) hash!: string;
  @ApiProperty({ example: '2026-11-25T10:00:05.000Z' }) createdAt!: string;
}

export class TraceDto {
  @ApiProperty({ type: InvestigationSummaryDto, nullable: true })
  investigation!: InvestigationSummaryDto | null;

  @ApiProperty({ type: [TraceStepDto] })
  steps!: TraceStepDto[];

  @ApiProperty({
    description: 'True once the investigation has completed or failed.',
    example: false,
  })
  done!: boolean;
}

export class ChainVerificationDto {
  @ApiProperty({ example: true }) valid!: boolean;
  @ApiProperty({ example: 9 }) checked!: number;
  @ApiPropertyOptional({ example: 4, description: 'The first step that fails verification.' })
  brokenAtSeq?: number;
}

export class CaseFileDto extends DisputeDetailDto {
  @ApiProperty({ type: [TraceStepDto] })
  steps!: TraceStepDto[];

  @ApiProperty({ type: ChainVerificationDto, nullable: true })
  chainVerification!: ChainVerificationDto | null;

  @ApiProperty({ example: '2026-11-25T10:01:05.000Z' })
  generatedAt!: string;
}
