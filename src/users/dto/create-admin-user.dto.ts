import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../database/models/user.model';

export class CreateAdminUserDto {
  @ApiProperty({
    description: 'Admin first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Admin password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  // This will be set automatically to ADMIN
  readonly type: UserType = UserType.ADMIN;
}