import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { CurrentUser, Public, type AuthUser } from './auth.decorators.js';
import { AuthService } from './auth.service.js';
import { MeDto, SignInDto, SignInResultDto } from './dto/auth.dto.js';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Post('auth/sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'signIn',
    summary: 'Sign in',
    description:
      'Demo sign-in with a work email and staff ID. Returns a bearer token valid for 12 hours. A first sign-in activates an invited account.',
  })
  @ApiSuccess(SignInResultDto, { description: 'Signed in.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.UNAUTHORIZED, "The email and staff ID don't match (`unauthorized`).")
  @ApiFailure(HttpStatus.FORBIDDEN, 'The account is suspended (`forbidden`).')
  signIn(@Body() body: SignInDto): Promise<SignInResultDto> {
    return this.auth.signIn(body);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'getMe', summary: 'The signed-in person and their permissions' })
  @ApiSuccess(MeDto, { description: 'The signed-in person.' })
  @ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
  @ApiFailure(HttpStatus.FORBIDDEN, 'The account is suspended (`forbidden`).')
  me(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.auth.me(user);
  }
}
