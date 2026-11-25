import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { CLASSIFIED_TYPES, type ClassifiedType } from '../common/domain.js';

export class SubmitDemoDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 40, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  count?: number;

  @ApiPropertyOptional({
    enum: CLASSIFIED_TYPES,
    isArray: true,
    description: 'Only cases expected to be these types.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(CLASSIFIED_TYPES, { each: true })
  types?: ClassifiedType[];

  @ApiPropertyOptional({ description: 'Submit every remaining case.' })
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class SubmitDemoResultDto {
  @ApiProperty({ example: 5 }) created!: number;
  @ApiProperty({ type: [String], example: ['dsp_01JD…'] }) disputeIds!: string[];
  @ApiProperty({ example: 35 }) remaining!: number;
}

export class OkDto {
  @ApiProperty({ example: true }) ok!: boolean;
}

export class EvalRowDto {
  @ApiProperty({ example: 'dmo_01' }) demoCaseId!: string;
  @ApiProperty({ nullable: true, type: String }) disputeId!: string | null;
  @ApiProperty({ example: 'failed_transfer' }) scenario!: string;
  @ApiProperty({ nullable: true, type: String, example: 'resolved' }) status!: string | null;
  @ApiProperty({ example: false }) pending!: boolean;
  @ApiProperty({ example: 'failed_transfer_debit' }) expectedType!: string;
  @ApiProperty({ nullable: true, type: String }) actualType!: string | null;
  @ApiProperty({ example: 'auto_resolve' }) expectedDisposition!: string;
  @ApiProperty({ nullable: true, type: String }) actualDisposition!: string | null;
  @ApiProperty() typeMatch!: boolean;
  @ApiProperty() dispositionMatch!: boolean;
  @ApiProperty() match!: boolean;
  @ApiProperty() evidenceValid!: boolean;
  @ApiProperty({ nullable: true, type: Number }) durationMs!: number | null;
}

export class ScenarioEvalDto {
  @ApiProperty({ example: 'failed_transfer' }) scenario!: string;
  @ApiProperty({ example: 8 }) total!: number;
  @ApiProperty({ example: 1 }) classificationAccuracy!: number;
  @ApiProperty({ example: 1 }) dispositionAccuracy!: number;
}

export class ModelCountDto {
  @ApiProperty({ example: 'hosted' }) profile!: string;
  @ApiProperty({ example: 'llama-3.3-70b' }) model!: string;
  @ApiProperty({ example: 40 }) count!: number;
}

export class EvalSummaryDto {
  @ApiProperty() totalCases!: number;
  @ApiProperty() submitted!: number;
  @ApiProperty() pending!: number;
  @ApiProperty() evaluated!: number;
  @ApiProperty() classificationAccuracy!: number;
  @ApiProperty() dispositionAccuracy!: number;
  @ApiProperty() evidenceValidityRate!: number;
  @ApiProperty() avgInvestigationMs!: number;
  @ApiProperty() p95InvestigationMs!: number;
  @ApiProperty({ type: [ScenarioEvalDto] }) byScenario!: ScenarioEvalDto[];
  @ApiProperty({ type: [ModelCountDto] }) models!: ModelCountDto[];
}

export class EvalDto {
  @ApiProperty({ type: [EvalRowDto] }) rows!: EvalRowDto[];
  @ApiProperty({
    example: 0.975,
    description: 'Share of evaluated cases where type and disposition both match.',
  })
  accuracy!: number;
  @ApiProperty({ type: EvalSummaryDto }) summary!: EvalSummaryDto;
}
