import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DISPUTE_REASON_CODES = [
  'unauthorised',
  'duplicate',
  'failed_transfer',
  'not_delivered',
  'other',
] as const;
export type DisputeReasonCode = (typeof DISPUTE_REASON_CODES)[number];

export const DISPUTE_STATUSES = [
  'queued',
  'investigating',
  'awaiting_review',
  'resolved',
  'rejected',
  'escalated',
  'failed',
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const CLASSIFIED_TYPES = [
  'failed_transfer_debit',
  'duplicate_charge',
  'unauthorised_payment',
  'merchant_non_delivery',
  'legitimate_transaction',
  'unknown',
] as const;
export type ClassifiedType = (typeof CLASSIFIED_TYPES)[number];

export const RESOLUTION_ACTIONS = ['reverse_debit', 'refund_duplicate', 'none'] as const;
export type ResolutionAction = (typeof RESOLUTION_ACTIONS)[number];

export class CreateDisputeDto {
  @ApiProperty({
    description: 'ID of the disputed transaction.',
    example: 'txn_01JD8Q3W4N7Z2R5K',
  })
  @IsString()
  @Matches(/^txn_[A-Za-z0-9]+$/, { message: 'transactionId must look like txn_…' })
  transactionId!: string;

  @ApiProperty({ enum: DISPUTE_REASON_CODES, example: 'failed_transfer' })
  @IsIn(DISPUTE_REASON_CODES)
  reasonCode!: DisputeReasonCode;

  @ApiPropertyOptional({
    description:
      "The customer's own words. Treated as untrusted data and never as instructions to the agent.",
    example: 'I sent 40k to my supplier and he did not get it.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerNotes?: string;
}

export class ListDisputesQueryDto {
  @ApiPropertyOptional({
    enum: DISPUTE_STATUSES,
    isArray: true,
    description: 'Only disputes in these statuses. Repeat the parameter for several.',
  })
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayUnique()
  @IsIn(DISPUTE_STATUSES, { each: true })
  status?: DisputeStatus[];

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 25;
}

export class DisputeDto {
  @ApiProperty({ example: 'dsp_01JD8Q5C9V2M4X7P' })
  id!: string;

  @ApiProperty({ example: 'txn_01JD8Q3W4N7Z2R5K' })
  transactionId!: string;

  @ApiProperty({ example: 'cus_01JD7Z0A1B2C3D4E' })
  customerId!: string;

  @ApiProperty({ enum: DISPUTE_REASON_CODES, example: 'failed_transfer' })
  reasonCode!: DisputeReasonCode;

  @ApiProperty({ enum: DISPUTE_STATUSES, example: 'queued' })
  status!: DisputeStatus;

  @ApiProperty({
    description: 'Disputed amount in kobo (integer). ₦40,000.00 is 4000000.',
    example: 4000000,
  })
  amountMinor!: number;

  @ApiProperty({ example: 'NGN' })
  currency!: 'NGN';

  @ApiPropertyOptional({ enum: CLASSIFIED_TYPES, nullable: true, example: null })
  classifiedType!: ClassifiedType | null;

  @ApiPropertyOptional({ enum: RESOLUTION_ACTIONS, nullable: true, example: null })
  resolutionAction!: ResolutionAction | null;

  @ApiPropertyOptional({ enum: ['agent', 'analyst'], nullable: true, example: null })
  resolvedBy!: 'agent' | 'analyst' | null;

  @ApiProperty({
    description: 'Resolution deadline (ISO 8601).',
    example: '2026-11-28T10:00:00.000Z',
  })
  slaDueAt!: string;

  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' })
  updatedAt!: string;
}
