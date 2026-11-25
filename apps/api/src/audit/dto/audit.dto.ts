import { ApiProperty } from '@nestjs/swagger';
import { AnalystActionDto } from '../../disputes/dto/dispute.dto.js';

export class InvestigationAuditDto {
  @ApiProperty({ example: 'inv_01JD…' }) id!: string;
  @ApiProperty({ example: 'dsp_01JD…' }) disputeId!: string;
  @ApiProperty({ example: 'llama-3.3-70b' }) model!: string;
  @ApiProperty({ example: 'hosted' }) profile!: string;
  @ApiProperty({ nullable: true, type: String, example: 'hosted' }) providerKind!: string | null;
  @ApiProperty({ example: 9 }) stepsCount!: number;
  @ApiProperty({ nullable: true, type: Number, example: 63000 }) durationMs!: number | null;
  @ApiProperty({ enum: ['running', 'completed', 'failed'], example: 'completed' }) status!: string;
  @ApiProperty({ example: '2026-11-25T10:00:01.000Z' }) startedAt!: string;
}

export class ActionAuditDto extends AnalystActionDto {
  @ApiProperty({ example: 'dsp_01JD…' }) disputeId!: string;
}

export class AccessAuditDto {
  @ApiProperty({ example: 'acc_01JD…' }) id!: string;
  @ApiProperty({ example: 'admin@bank.example' }) actorEmail!: string;
  @ApiProperty({
    enum: ['invited', 'role_changed', 'suspended', 'reinstated', 'first_sign_in', 'demo_reset'],
    example: 'role_changed',
  })
  action!: string;
  @ApiProperty({ example: 'ada@bank.example' }) targetEmail!: string;
  @ApiProperty({ nullable: true, type: String, example: 'analyst → admin' }) detail!: string | null;
  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' }) createdAt!: string;
}
