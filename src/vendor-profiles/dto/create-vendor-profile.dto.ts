import { IsString, IsOptional, IsNumber, IsUrl, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVendorProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @IsNumber()
  user_id: number;

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
    example: 'Tech Solutions Inc.',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Solutions LLC',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({
    description: 'Contact person',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({
    description: 'Designation',
    example: 'CEO',
    required: false,
  })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Website URL',
    example: 'https://techsolutions.com',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Business registration certificate path',
    example: '/uploads/certificate.pdf',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_registration_certificate?: string;

  @ApiProperty({
    description: 'GST number',
    example: 'GST123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiProperty({
    description: 'Business address',
    example: '123 Main St, New York, NY 10001',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Company details',
    example: 'We provide cutting-edge technology solutions...',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_details?: string;

  @ApiProperty({
    description: 'WhatsApp number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @ApiProperty({
    description: 'Logo path',
    example: '/uploads/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    description: 'Working days',
    example: 'Monday to Friday',
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
    example: 'Bank Transfer, Credit Card',
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

  @ApiProperty({
    description: 'Creator user ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  created_by?: number;
}