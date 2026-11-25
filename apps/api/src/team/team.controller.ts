import { Body, Controller, Get, HttpStatus, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type AuthUser } from '../auth/auth.decorators.js';
import { ApiFailure, ApiSuccess } from '../common/decorators/api-envelope.decorator.js';
import { InviteStaffDto, StaffMemberDto, UpdateStaffDto } from './team.dto.js';
import { TeamService } from './team.service.js';

@ApiTags('team')
@ApiBearerAuth()
@ApiFailure(HttpStatus.UNAUTHORIZED, 'No or invalid token (`unauthorized`).')
@ApiFailure(HttpStatus.FORBIDDEN, 'The role lacks the permission (`forbidden`).')
@RequirePermission('team.manage')
@Controller('team')
export class TeamController {
  constructor(@Inject(TeamService) private readonly team: TeamService) {}

  @Get()
  @ApiOperation({ operationId: 'listStaff', summary: 'Everyone who can sign in' })
  @ApiSuccess(StaffMemberDto, { isArray: true, description: 'All staff.' })
  list(): Promise<StaffMemberDto[]> {
    return this.team.list();
  }

  @Post()
  @ApiOperation({ operationId: 'inviteStaff', summary: 'Invite someone' })
  @ApiSuccess(StaffMemberDto, { status: HttpStatus.CREATED, description: 'Invited.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.CONFLICT, 'The email or staff ID is taken (`conflict`, `details.field`).')
  invite(@Body() body: InviteStaffDto, @CurrentUser() user: AuthUser): Promise<StaffMemberDto> {
    return this.team.invite(body, user);
  }

  @Patch(':id')
  @ApiOperation({
    operationId: 'updateStaff',
    summary: "Change someone's role, or suspend or reinstate them",
    description: 'Send exactly one of `role` or `status`.',
  })
  @ApiParam({ name: 'id', example: 'usr_01JD8Q5C9V2M4X7P' })
  @ApiSuccess(StaffMemberDto, { description: 'Updated.' })
  @ApiFailure(HttpStatus.BAD_REQUEST, 'The body is invalid (`validation_error`).')
  @ApiFailure(HttpStatus.NOT_FOUND, 'No one with that ID (`not_found`).')
  @ApiFailure(
    HttpStatus.CONFLICT,
    'Changing your own access (`self_change`) or leaving no active admin (`last_admin`).',
  )
  update(@Param('id') id: string, @Body() body: UpdateStaffDto, @CurrentUser() user: AuthUser) {
    return this.team.update(id, body, user);
  }
}
