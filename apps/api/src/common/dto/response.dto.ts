import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseMetaDto {
  @ApiProperty({
    description: 'Request ID, echoed in the `x-request-id` header.',
    example: 'req_8f2c1e5a9b',
  })
  requestId!: string;

  @ApiProperty({
    description: 'When the response was produced (ISO 8601).',
    example: '2026-11-25T10:00:00.000Z',
  })
  timestamp!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page, starting at 1.', example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page.', example: 25, minimum: 1, maximum: 100 })
  pageSize!: number;

  @ApiProperty({ description: 'Total items across all pages.', example: 312, minimum: 0 })
  total!: number;
}

export class FieldErrorDto {
  @ApiProperty({ description: 'Path of the invalid field.', example: 'transactionId' })
  field!: string;

  @ApiProperty({ description: 'What is wrong with it.', example: 'transactionId must be a string' })
  message!: string;
}

export class ErrorBodyDto {
  @ApiProperty({
    description: 'Stable, machine-readable error code.',
    example: 'validation_error',
    enum: [
      'validation_error',
      'unauthorized',
      'forbidden',
      'not_found',
      'conflict',
      'invalid_state',
      'rate_limited',
      'not_implemented',
      'service_unavailable',
      'internal_error',
    ],
  })
  code!: string;

  @ApiProperty({
    description: 'Human-readable explanation.',
    example: 'The request body is invalid.',
  })
  message!: string;

  @ApiPropertyOptional({
    type: [FieldErrorDto],
    description: 'Per-field problems, for `validation_error`.',
  })
  fieldErrors?: FieldErrorDto[];

  @ApiPropertyOptional({
    description: 'Extra structured context about the error.',
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, unknown>;
}

export class ErrorResponseDto {
  @ApiProperty({ enum: [false], example: false })
  success!: false;

  @ApiProperty({ type: ErrorBodyDto })
  error!: ErrorBodyDto;

  @ApiProperty({ type: ResponseMetaDto })
  meta!: ResponseMetaDto;
}
