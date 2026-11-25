import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
import {
  AGENT_OUTCOMES,
  CLASSIFIED_TYPES,
  DISPUTE_REASON_CODES,
  DISPUTE_STATUSES,
  POLICY_DISPOSITIONS,
  POLICY_REASON_CODES,
  RECOMMENDED_ACTIONS,
  RESOLUTION_ACTIONS,
  RISK_LEVELS,
  type AgentOutcome,
  type ClassifiedType,
  type DisputeReasonCode,
  type DisputeStatus,
  type PolicyDisposition,
  type PolicyReasonCode,
  type RecommendedAction,
  type ResolutionAction,
  type RiskLevel,
} from '../../common/domain.js';

const toArray = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];
const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDisputeDto {
  @ApiProperty({ description: 'ID of the disputed transaction.', example: 'txn_01JD8Q3W4N7Z2R5K' })
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
  @Transform(trimmed)
  @IsString()
  @MaxLength(2000)
  customerNotes?: string;
}

export const DISPUTE_SORTS = ['createdAt', 'slaDueAt', 'amountMinor', 'confidence'] as const;
export type DisputeSort = (typeof DISPUTE_SORTS)[number];

export class ListDisputesQueryDto {
  @ApiPropertyOptional({
    enum: DISPUTE_STATUSES,
    isArray: true,
    description: 'Only disputes in these statuses. Repeat the parameter for several.',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayUnique()
  @IsIn(DISPUTE_STATUSES, { each: true })
  status?: DisputeStatus[];

  @ApiPropertyOptional({
    enum: CLASSIFIED_TYPES,
    isArray: true,
    description: 'Only disputes whose latest investigation classified them as one of these types.',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayUnique()
  @IsIn(CLASSIFIED_TYPES, { each: true })
  type?: ClassifiedType[];

  @ApiPropertyOptional({
    description: 'Matches the dispute ID, transaction reference, customer ID or customer name.',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: DISPUTE_SORTS, default: 'createdAt' })
  @IsOptional()
  @IsIn(DISPUTE_SORTS)
  sort: DisputeSort = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

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

export class DisputeListItemDto {
  @ApiProperty({ example: 'dsp_01JD8Q5C9V2M4X7P' })
  id!: string;

  @ApiProperty({ example: 'TX-2026-114820', description: 'Transaction reference.' })
  reference!: string;

  @ApiProperty({ example: 'txn_01JD8Q3W4N7Z2R5K' })
  transactionId!: string;

  @ApiProperty({ example: 'cus_01JD7Z0A1B2C3D4E' })
  customerId!: string;

  @ApiProperty({ example: 'Funke A.', description: 'Masked: first name and last initial.' })
  customerName!: string;

  @ApiProperty({ enum: DISPUTE_REASON_CODES, example: 'failed_transfer' })
  reasonCode!: DisputeReasonCode;

  @ApiProperty({ description: 'Disputed amount in kobo. ₦40,000.00 is 4000000.', example: 4000000 })
  amountMinor!: number;

  @ApiProperty({ enum: DISPUTE_STATUSES, example: 'resolved' })
  status!: DisputeStatus;

  @ApiProperty({ enum: ['agent', 'analyst'], nullable: true, example: 'agent' })
  resolvedBy!: 'agent' | 'analyst' | null;

  @ApiProperty({ enum: CLASSIFIED_TYPES, nullable: true, example: 'failed_transfer_debit' })
  classifiedType!: ClassifiedType | null;

  @ApiProperty({ nullable: true, type: Number, example: 0.96 })
  confidence!: number | null;

  @ApiProperty({ example: false })
  fraudSuspected!: boolean;

  @ApiProperty({ enum: POLICY_DISPOSITIONS, nullable: true, example: 'auto_resolve' })
  policyDisposition!: PolicyDisposition | null;

  @ApiProperty({ example: '2026-11-28T10:00:00.000Z' })
  slaDueAt!: string;

  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-25T10:01:05.000Z' })
  updatedAt!: string;
}

export class DisputeSummaryDto extends DisputeListItemDto {
  @ApiProperty({ nullable: true, type: String, example: 'I sent 40k to my supplier…' })
  customerNotes!: string | null;

  @ApiProperty({ enum: RESOLUTION_ACTIONS, nullable: true, example: 'reverse_debit' })
  resolutionAction!: ResolutionAction | null;

  @ApiProperty({ nullable: true, type: String, example: '2026-11-25T10:01:05.000Z' })
  resolvedAt!: string | null;

  @ApiProperty({ nullable: true, type: String, example: null })
  lastError!: string | null;
}

export class TransactionSummaryDto {
  @ApiProperty({ example: 'txn_01JD8Q3W4N7Z2R5K' })
  id!: string;

  @ApiProperty({ example: 'TX-2026-114820' })
  reference!: string;

  @ApiProperty({ enum: ['card_payment', 'transfer', 'pos', 'web'], example: 'transfer' })
  type!: string;

  @ApiProperty({ enum: ['mobile', 'web', 'pos', 'atm', 'ussd'], example: 'mobile' })
  channel!: string;

  @ApiProperty({ example: 4000000 })
  amountMinor!: number;

  @ApiProperty({ enum: ['successful', 'failed', 'pending', 'reversed'], example: 'reversed' })
  status!: string;

  @ApiProperty({ nullable: true, type: String, example: null })
  merchantName!: string | null;

  @ApiProperty({ nullable: true, type: String, example: 'Bola S.' })
  counterpartyName!: string | null;

  @ApiProperty({ nullable: true, type: String, example: 'Zenith' })
  counterpartyBank!: string | null;

  @ApiProperty({ example: 'Abeokuta' })
  city!: string;

  @ApiProperty({ example: 'NG' })
  ipCountry!: string;

  @ApiProperty({ example: '2026-11-25T07:12:00.000Z' })
  createdAt!: string;
}

export class CustomerSummaryDto {
  @ApiProperty({ example: 'cus_01JD7Z0A1B2C3D4E' })
  id!: string;

  @ApiProperty({ example: 'Funke A.' })
  name!: string;

  @ApiProperty({ enum: ['retail', 'sme'], example: 'retail' })
  segment!: string;

  @ApiProperty({ example: 'Abeokuta' })
  homeCity!: string;

  @ApiProperty({ example: 1460 })
  accountAgeDays!: number;

  @ApiProperty({ enum: RISK_LEVELS, example: 'low' })
  riskProfile!: RiskLevel;
}

export class EvidenceItemDto {
  @ApiProperty({ example: 'stp_01JD8Q6A…' })
  toolCallId!: string;

  @ApiProperty({ example: 'Debit of ₦40,000 posted, no credit or reversal' })
  claim!: string;
}

export class InvestigationSummaryDto {
  @ApiProperty({ example: 'inv_01JD8Q6…' })
  id!: string;

  @ApiProperty({ example: 1 })
  attempt!: number;

  @ApiProperty({ enum: ['running', 'completed', 'failed'], example: 'completed' })
  status!: 'running' | 'completed' | 'failed';

  @ApiProperty({ example: 'hosted' })
  profile!: string;

  @ApiProperty({ nullable: true, type: String, example: 'hosted' })
  providerKind!: string | null;

  @ApiProperty({ example: 'llama-3.3-70b' })
  model!: string;

  @ApiProperty({ enum: AGENT_OUTCOMES, nullable: true, example: 'auto_resolve' })
  outcome!: AgentOutcome | null;

  @ApiProperty({ nullable: true, type: Number, example: 0.96 })
  confidence!: number | null;

  @ApiProperty({ enum: RISK_LEVELS, nullable: true, example: 'low' })
  riskLevel!: RiskLevel | null;

  @ApiProperty({ example: false })
  fraudSuspected!: boolean;

  @ApiProperty({ enum: CLASSIFIED_TYPES, nullable: true, example: 'failed_transfer_debit' })
  classifiedType!: ClassifiedType | null;

  @ApiProperty({ enum: RECOMMENDED_ACTIONS, nullable: true, example: 'reverse_debit' })
  recommendedAction!: RecommendedAction | null;

  @ApiProperty({ nullable: true, type: String })
  reasoning!: string | null;

  @ApiProperty({ type: [EvidenceItemDto] })
  evidence!: EvidenceItemDto[];

  @ApiProperty({ type: [String], description: 'Why the evidence failed validation, if it did.' })
  evidenceProblems!: string[];

  @ApiProperty({ nullable: true, type: String })
  customerMessage!: string | null;

  @ApiProperty({ enum: POLICY_DISPOSITIONS, nullable: true, example: 'auto_resolve' })
  policyDisposition!: PolicyDisposition | null;

  @ApiProperty({ enum: POLICY_REASON_CODES, isArray: true, example: [] })
  policyReasons!: PolicyReasonCode[];

  @ApiProperty({ example: true })
  evidenceValid!: boolean;

  @ApiProperty({ example: 9 })
  stepsCount!: number;

  @ApiProperty({ example: 10451 })
  tokensIn!: number;

  @ApiProperty({ example: 1085 })
  tokensOut!: number;

  @ApiProperty({ nullable: true, type: String, example: null })
  error!: string | null;

  @ApiProperty({ example: '2026-11-25T10:00:01.000Z' })
  startedAt!: string;

  @ApiProperty({ nullable: true, type: String, example: '2026-11-25T10:01:04.000Z' })
  finishedAt!: string | null;
}

export class AnalystActionDto {
  @ApiProperty({ example: 'act_01JD…' })
  id!: string;

  @ApiProperty({ example: 'ada@bank.example' })
  actorEmail!: string;

  @ApiProperty({
    enum: ['approve', 'override', 'escalate', 'edit_message', 'retry'],
    example: 'override',
  })
  action!: string;

  @ApiProperty({ enum: RESOLUTION_ACTIONS, nullable: true, example: 'none' })
  overrideAction!: ResolutionAction | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: 'Customer confirmed the merchant delivered.',
  })
  reason!: string | null;

  @ApiProperty({ example: '2026-11-25T10:05:00.000Z' })
  createdAt!: string;
}

export class DisputeDetailDto {
  @ApiProperty({ type: DisputeSummaryDto })
  dispute!: DisputeSummaryDto;

  @ApiProperty({ type: TransactionSummaryDto })
  transaction!: TransactionSummaryDto;

  @ApiProperty({ type: CustomerSummaryDto })
  customer!: CustomerSummaryDto;

  @ApiProperty({ type: InvestigationSummaryDto, nullable: true })
  investigation!: InvestigationSummaryDto | null;

  @ApiProperty({ type: [AnalystActionDto] })
  analystActions!: AnalystActionDto[];
}

export class DisputeCountsDto {
  @ApiProperty({ example: 3 }) queued!: number;
  @ApiProperty({ example: 1 }) investigating!: number;
  @ApiProperty({ example: 4 }) awaiting_review!: number;
  @ApiProperty({ example: 28 }) resolved!: number;
  @ApiProperty({ example: 3 }) rejected!: number;
  @ApiProperty({ example: 1 }) escalated!: number;
  @ApiProperty({ example: 0 }) failed!: number;
}

export class DisputeListMetaDto {
  @ApiProperty({
    type: DisputeCountsDto,
    description:
      'Counts per status for the same search and type filter, ignoring the status filter.',
  })
  countsByStatus!: DisputeCountsDto;
}
