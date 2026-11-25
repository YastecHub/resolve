import { ApiProperty } from '@nestjs/swagger';
import { DisputeCountsDto } from '../disputes/dto/dispute.dto.js';

export class SlaDto {
  @ApiProperty({ example: 1, description: 'Open disputes due within 12 hours.' }) atRisk!: number;
  @ApiProperty({ example: 0, description: 'Open disputes past their deadline.' }) breached!: number;
}
export class HourCountDto {
  @ApiProperty({ example: '2026-11-25T09:00:00.000Z' }) hour!: string;
  @ApiProperty({ example: 6 }) count!: number;
}
export class TypeCountDto {
  @ApiProperty({ example: 'failed_transfer_debit' }) type!: string;
  @ApiProperty({ example: 8 }) count!: number;
}
export class OutcomeValuesDto {
  @ApiProperty({ example: 6 }) auto_resolve!: number;
  @ApiProperty({ example: 2 }) needs_review!: number;
}
export class TypeOutcomesDto {
  @ApiProperty({ example: 'failed_transfer_debit' }) type!: string;
  @ApiProperty({ type: OutcomeValuesDto }) values!: OutcomeValuesDto;
}
export class ProviderUsageDto {
  @ApiProperty({ example: 'hosted' }) profile!: string;
  @ApiProperty({ example: 'llama-3.3-70b' }) model!: string;
  @ApiProperty({ example: 40 }) count!: number;
  @ApiProperty({ example: 64000 }) avgMs!: number;
}
export class MetricsDto {
  @ApiProperty({ type: DisputeCountsDto }) countsByStatus!: DisputeCountsDto;
  @ApiProperty({ example: 28 }) resolvedCount!: number;
  @ApiProperty({ example: 0.68 }) autoResolutionRate!: number;
  @ApiProperty({ example: 0.32 }) reviewRate!: number;
  @ApiProperty({ example: 0.12 }) overrideRate!: number;
  @ApiProperty({ example: 65500 }) avgInvestigationMs!: number;
  @ApiProperty({ example: 61200 }) p50InvestigationMs!: number;
  @ApiProperty({ example: 104000 }) p95InvestigationMs!: number;
  @ApiProperty({ type: SlaDto }) sla!: SlaDto;
  @ApiProperty({ type: [HourCountDto] }) throughputByHour!: HourCountDto[];
  @ApiProperty({ type: [TypeCountDto] }) byType!: TypeCountDto[];
  @ApiProperty({ type: [TypeOutcomesDto] }) outcomesByType!: TypeOutcomesDto[];
  @ApiProperty({ type: [ProviderUsageDto] }) providerUsage!: ProviderUsageDto[];
  @ApiProperty({ nullable: true, type: String, example: '2026-11-25T08:12:00.000Z' })
  oldestReviewAt!: string | null;
}
