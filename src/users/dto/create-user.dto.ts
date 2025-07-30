import { IsEnum, IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../database/models/user.model';

export class CreateUserDto {
  @ApiProperty({
    description: 'User type',
    enum: UserType,
    example: UserType.CUSTOMER,
  })
  @IsEnum(UserType)
  type: UserType;

  @ApiProperty({
    description: 'AWS Cognito user ID',
    example: 'us-east-1:12345678-1234-1234-1234-123456789012',
  })
  @IsString()
  aws_cognito_id: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User postal code',
    example: '12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  post_code?: string;

  @ApiProperty({
    description: 'User country',
    example: 'United States',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'User city',
    example: 'New York',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Is user verified',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiProperty({
    description: 'Verification timestamp',
    example: new Date(),
    required: false,
  })
  @IsOptional()
  verified_at?: Date;
  @ApiProperty({
    description: 'Is profile updated',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_profile_updated?: boolean;

  @ApiProperty({
    description: 'Creator user ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  created_by?: number;
}