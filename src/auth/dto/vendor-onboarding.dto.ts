import { IsString, IsOptional, IsNumber, IsUrl, Min, Max, IsBoolean, IsEmail, IsPhoneNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserType } from '../../database/models/user.model';

export class VendorOnboardingDto {
  // User-related fields
  @ApiProperty({
    description: 'User first name',
    example: 'Vaishnav',
  })
  @IsString()
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+2466689410',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'User type',
    enum: UserType,
    example: UserType.VENDOR,
  })
  @IsEnum(UserType)
  type: UserType;

  @ApiProperty({
    description: 'AWS Cognito user ID',
    example: 'us-east-1:239xcea4b-9vop-sdso-b0gw-c6eke3uv2mf',
    required: false,
  })
  @IsOptional()
  @IsString()
  aws_cognito_id?: string;

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
    example: 'India',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'User city',
    example: 'bschdbc',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Is user verified',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiProperty({
    description: 'Verification timestamp',
    example: '2025-07-25T06:50:46.874Z',
    required: false,
  })
  @IsOptional()
  verified_at?: Date;

  @ApiProperty({
    description: 'Is profile updated',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_profile_updated?: boolean;

  // Vendor profile fields
  @ApiProperty({
    description: 'Business type',
    example: 'Technology',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Intersmart',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Intersmart',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({
    description: 'Contact person',
    example: 'Vaishnav',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({
    description: 'Designation',
    example: 'dev',
    required: false,
  })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({
    description: 'Website URL',
    example: 'https://jubeerich.com',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Business registration certificate (base64 string or URL)',
    example: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9IiNGMzAwMDAiPg...',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_registration_certificate?: string;

  @ApiProperty({
    description: 'GST number',
    example: 'kjschjhdc',
    required: false,
  })
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiProperty({
    description: 'Business address',
    example: 'ncbhbdc',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Company details',
    example: 'We are a leading technology solutions provider.',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_details?: string;

  @ApiProperty({
    description: 'WhatsApp number',
    example: '+2466689410',
    required: false,
  })
  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @ApiProperty({
    description: 'Logo (base64 string or URL)',
    example: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9IiNGMzAwMDAiPg...',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    description: 'Working days',
    example: 'Monday - Friday',
    required: false,
  })
  @IsOptional()
  @IsString()
  working_days?: string;

  @ApiProperty({
    description: 'Employee count',
    example: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  employee_count?: number;

  @ApiProperty({
    description: 'Payment mode',
    example: 'Bank Transfer',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_mode?: string;

  @ApiProperty({
    description: 'Establishment year',
    example: 2020,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  establishment?: number;
}