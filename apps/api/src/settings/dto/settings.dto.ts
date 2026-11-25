import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CLASSIFIED_TYPES,
  EXECUTION_MODES,
  type ClassifiedType,
  type ExecutionMode,
} from '../../common/domain.js';

export class PolicySettingsDto {
  @ApiProperty({ minimum: 0, maximum: 1, example: 0.9 })
  confidenceThreshold!: number;

  @ApiProperty({
    description: 'Largest amount, in kobo, that can be auto-resolved.',
    example: 5000000,
  })
  valueCapMinor!: number;

  @ApiProperty({
    enum: CLASSIFIED_TYPES,
    isArray: true,
    example: ['failed_transfer_debit', 'duplicate_charge'],
  })
  autoTypes!: ClassifiedType[];

  @ApiProperty({
    enum: CLASSIFIED_TYPES,
    isArray: true,
    example: ['unauthorised_payment', 'merchant_non_delivery'],
  })
  reviewTypes!: ClassifiedType[];

  @ApiProperty({ minimum: 1, example: 2 })
  minEvidenceForAuto!: number;

  @ApiProperty({ enum: EXECUTION_MODES, example: 'execute' })
  executionMode!: ExecutionMode;
}

export class AgentSettingsDto {
  @ApiProperty({ minimum: 1, maximum: 30, example: 8 })
  maxSteps!: number;

  @ApiProperty({ minimum: 1, example: 10 })
  duplicateWindowMinutes!: number;
}

export class AiSettingsDto {
  @ApiProperty({ example: 'hosted' })
  activeProfile!: string;
}

export class SettingsDto {
  @ApiProperty({ type: PolicySettingsDto })
  policy!: PolicySettingsDto;

  @ApiProperty({ type: AgentSettingsDto })
  agent!: AgentSettingsDto;

  @ApiProperty({ type: AiSettingsDto })
  ai!: AiSettingsDto;
}

export class UpdatePolicySettingsDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceThreshold?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  valueCapMinor?: number;

  @ApiPropertyOptional({ enum: CLASSIFIED_TYPES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(CLASSIFIED_TYPES, { each: true })
  autoTypes?: ClassifiedType[];

  @ApiPropertyOptional({ enum: CLASSIFIED_TYPES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(CLASSIFIED_TYPES, { each: true })
  reviewTypes?: ClassifiedType[];

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minEvidenceForAuto?: number;

  @ApiPropertyOptional({ enum: EXECUTION_MODES })
  @IsOptional()
  @IsIn(EXECUTION_MODES)
  executionMode?: ExecutionMode;
}

export class UpdateAgentSettingsDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  maxSteps?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duplicateWindowMinutes?: number;
}

export class UpdateAiSettingsDto {
  @ApiPropertyOptional({ description: 'Must be a configured profile name.' })
  @IsOptional()
  @IsString()
  activeProfile?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ type: UpdatePolicySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePolicySettingsDto)
  policy?: UpdatePolicySettingsDto;

  @ApiPropertyOptional({ type: UpdateAgentSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAgentSettingsDto)
  agent?: UpdateAgentSettingsDto;

  @ApiPropertyOptional({ type: UpdateAiSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAiSettingsDto)
  ai?: UpdateAiSettingsDto;
}
