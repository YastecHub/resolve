import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto, PaginationMetaDto, ResponseMetaDto } from '../dto/response.dto.js';

interface SuccessOptions {
  status?: HttpStatus;
  description: string;
  isArray?: boolean;
  paginated?: boolean;
}

export function ApiSuccess<T extends Type<unknown>>(model: T, options: SuccessOptions) {
  const many = options.isArray || options.paginated;
  const data = many
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };
  const meta = options.paginated
    ? {
        allOf: [
          { $ref: getSchemaPath(ResponseMetaDto) },
          { $ref: getSchemaPath(PaginationMetaDto) },
        ],
      }
    : { $ref: getSchemaPath(ResponseMetaDto) };

  return applyDecorators(
    ApiExtraModels(model, ResponseMetaDto, PaginationMetaDto),
    ApiResponse({
      status: options.status ?? HttpStatus.OK,
      description: options.description,
      schema: {
        type: 'object',
        required: ['success', 'data', 'meta'],
        properties: { success: { type: 'boolean', enum: [true] }, data, meta },
      },
    }),
  );
}

export function ApiFailure(status: HttpStatus, description: string) {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({ status, description, type: ErrorResponseDto }),
  );
}

export function ApiStandardErrors() {
  return applyDecorators(
    ApiFailure(HttpStatus.INTERNAL_SERVER_ERROR, 'Unexpected error (`internal_error`).'),
  );
}
