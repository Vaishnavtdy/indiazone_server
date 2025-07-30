import { IsString, IsEnum, IsNotEmpty, MaxLength, IsNumber, IsOptional, IsArray, ValidateNested, Min, IsUrl, IsBoolean, isNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductStatus } from '../../database/models/product.model';

// Enum for product specification status
export enum ProductSpecificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export class CreateProductImageDto {
  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  image_url: string;

  @ApiProperty({
    description: 'Alt text for image',
    example: 'Product main image',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string;

  @ApiProperty({
    description: 'Is primary image',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiProperty({
    description: 'Sort order',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sort_order?: number;
}

export class CreateProductSpecificationDto {
  @ApiProperty({
    description: 'Specification attribute name',
    example: 'Material',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key_name: string;

  @ApiProperty({
    description: 'Specification attribute value',
    example: '100% Cotton',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;

  @ApiProperty({
    description: 'Specification status',
    enum: ProductSpecificationStatus,
    example: ProductSpecificationStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductSpecificationStatus)
  status?: ProductSpecificationStatus;

  @ApiProperty({
    description: 'User ID who created this specification',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  created_by?: number;

  @ApiProperty({
    description: 'User ID who last updated this specification',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  updated_by?: number;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Client ID',
    example: 1,
    required: true,
  })
   @IsNotEmpty()
  @Type(() => Number)
  client_id: number;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
  })
   @IsNotEmpty()
  @Type(() => Number)
  category_id: number;

  @ApiProperty({
    description: 'Unit ID',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  unit_id: number;

  @ApiProperty({
    description: 'Product name',
    example: 'Premium Cotton T-Shirt',
    maxLength: 200,
    required: false,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product slug (auto-generated if not provided)',
    example: 'premium-cotton-t-shirt',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({
    description: 'Short description',
    example: 'Comfortable premium cotton t-shirt',
    required: false,
  })
  @IsOptional()
  @IsString()
  short_description?: string;

  @ApiProperty({
    description: 'Detailed description',
    example: 'This premium cotton t-shirt offers exceptional comfort...',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;


  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({
    description: 'Product images',
    type: [CreateProductImageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @ApiProperty({
    description: 'Product specifications',
    type: [CreateProductSpecificationDto],
    required: false,
    example: [
      {
        key_name: 'Material',
        value: '100% Cotton',
        status: 'pending'
      },
      {
        key_name: 'Weight',
        value: '180gsm',
        status: 'pending'
      }
    ]
  })
  @IsOptional()
  @Type(() => CreateProductSpecificationDto)
  specifications?: CreateProductSpecificationDto[];

  @ApiProperty({
    description: 'Temporary UUID for organizing product images in S3 before product creation',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsString()
  temp_product_uuid?: string;
}