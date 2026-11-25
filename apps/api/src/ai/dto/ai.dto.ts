import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiProfileDto {
  @ApiProperty({ example: 'hosted' })
  name!: string;

  @ApiProperty({ example: 'Hosted' })
  label!: string;

  @ApiProperty({ example: 'hosted', description: '`hosted` or `onprem`.' })
  kind!: string;

  @ApiProperty({ example: 'llama-3.3-70b' })
  model!: string;

  @ApiProperty({
    example: 'gateway.ai.example',
    description: 'Endpoint host only; keys are never returned.',
  })
  endpoint!: string;

  @ApiProperty({ example: true })
  active!: boolean;
}

export class AiProfileTestDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 412 })
  latencyMs!: number;

  @ApiProperty({ example: 'llama-3.3-70b' })
  model!: string;

  @ApiPropertyOptional({ example: 'The model returned HTTP 401.' })
  error?: string;
}
