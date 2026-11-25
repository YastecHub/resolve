import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { STAFF_ROLES, STAFF_STATUSES, type StaffRole, type StaffStatus } from '../common/domain.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class StaffMemberDto {
  @ApiProperty({ example: 'usr_01JD…' }) id!: string;
  @ApiProperty({ example: '100234' }) staffId!: string;
  @ApiProperty({ example: 'Ada Okafor' }) name!: string;
  @ApiProperty({ example: 'ada@bank.example' }) email!: string;
  @ApiProperty({ enum: STAFF_ROLES, example: 'analyst' }) role!: StaffRole;
  @ApiProperty({ enum: STAFF_STATUSES, example: 'active' }) status!: StaffStatus;
  @ApiProperty({ nullable: true, type: String, example: 'admin@bank.example' }) invitedBy!:
    string | null;
  @ApiProperty({ example: '2026-11-25T10:00:00.000Z' }) createdAt!: string;
  @ApiProperty({ nullable: true, type: String, example: null }) lastSignInAt!: string | null;
}

export class InviteStaffDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Ada Okafor' })
  @Transform(trim)
  @IsString()
  @Length(2, 100, { message: "Enter the person's full name." })
  name!: string;

  @ApiProperty({ example: 'ada@bank.example' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Enter a valid work email.' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '100234' })
  @Transform(trim)
  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'A staff ID is 4 to 8 digits.' })
  staffId!: string;

  @ApiProperty({ enum: STAFF_ROLES, example: 'analyst' })
  @IsIn(STAFF_ROLES)
  role!: StaffRole;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({
    enum: STAFF_ROLES,
    description: 'Send exactly one of `role` or `status`.',
  })
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: StaffRole;

  @ApiPropertyOptional({
    enum: ['suspended', 'active'],
    description: 'Send exactly one of `role` or `status`.',
  })
  @IsOptional()
  @IsIn(['suspended', 'active'])
  status?: 'suspended' | 'active';
}
