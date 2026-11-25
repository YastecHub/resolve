import { HttpStatus, ValidationPipe, type ValidationError } from '@nestjs/common';
import { AppException, type FieldError } from './errors/app.exception.js';

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new AppException(HttpStatus.BAD_REQUEST, {
        code: 'validation_error',
        message: 'The request is invalid.',
        fieldErrors: flatten(errors),
      }),
  });
}
