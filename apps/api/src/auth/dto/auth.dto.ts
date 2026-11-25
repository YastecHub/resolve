import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';
import { PERMISSIONS, STAFF_ROLES, type Permission, type StaffRole } from '../../common/domain.js';

const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SignInDto {
  @ApiProperty({ example: 'ada@bank.example', maxLength: 254 })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Enter a valid work email.' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '100234', description: '4 to 8 digits.' })
  @Transform(trim)
  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'A staff ID is 4 to 8 digits.' })
  staffId!: string;
}

export class SessionUserDto {
  @ApiProperty({ example: 'usr_01JD8Q5C9V2M4X7P' })
  id!: string;

  @ApiProperty({ example: 'ada@bank.example' })
  email!: string;

  @ApiProperty({ example: 'Ada Okafor' })
  name!: string;

  @ApiProperty({ example: '100234' })
  staffId!: string;

  @ApiProperty({ enum: STAFF_ROLES, example: 'analyst' })
  role!: StaffRole;
}

export class SignInResultDto {
  @ApiProperty({ description: 'Send as `Authorization: Bearer <token>`.' })
  token!: string;

  @ApiProperty({ example: '2026-11-25T22:00:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: SessionUserDto })
  user!: SessionUserDto;
}

export class MeDto extends SessionUserDto {
  @ApiProperty({
    enum: PERMISSIONS,
    isArray: true,
    example: ['cases.view', 'audit.view', 'cases.act'],
  })
  permissions!: Permission[];

  @ApiProperty({ nullable: true, type: String, example: '2026-11-25T10:00:00.000Z' })
  lastSignInAt!: string | null;
}
