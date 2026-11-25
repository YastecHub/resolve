import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { RESOLUTION_ACTIONS, type ResolutionAction } from '../../common/domain.js';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ApproveDisputeDto {
  @ApiPropertyOptional({
    minLength: 20,
    maxLength: 800,
    description: 'Replaces the customer message before it is sent.',
  })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(20, 800)
  message?: string;
}

export class OverrideDisputeDto {
  @ApiProperty({ enum: RESOLUTION_ACTIONS, example: 'none' })
  @IsIn(RESOLUTION_ACTIONS)
  action!: ResolutionAction;

  @ApiProperty({
    minLength: 10,
    maxLength: 500,
    example: 'Customer confirmed the merchant delivered.',
  })
  @Transform(trimmed)
  @IsString()
  @Length(10, 500)
  reason!: string;

  @ApiPropertyOptional({ minLength: 20, maxLength: 800 })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(20, 800)
  message?: string;
}

export class EscalateDisputeDto {
  @ApiProperty({
    minLength: 10,
    maxLength: 500,
    example: 'Needs the fraud team: device seen on two other accounts.',
  })
  @Transform(trimmed)
  @IsString()
  @Length(10, 500)
  reason!: string;
}

export class EditMessageDto {
  @ApiProperty({ minLength: 20, maxLength: 800 })
  @Transform(trimmed)
  @IsString()
  @Length(20, 800)
  message!: string;
}
