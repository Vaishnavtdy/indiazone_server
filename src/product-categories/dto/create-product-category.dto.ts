import { IsString, IsEnum, IsNotEmpty, MaxLength, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductCategoryCreatedBy } from '../../database/models/product-category.model';

export class CreateProductCategoryDto {
  @ApiProperty({
    description: 'Parent category ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_id?: number;

  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Category slug',
    example: 'electronics',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiProperty({
    description: 'Units for this category',
    example: 'piece, kg, meter',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  units?: string;

  @ApiProperty({
    description: 'Created by',
    enum: ProductCategoryCreatedBy,
    example: ProductCategoryCreatedBy.ADMIN,
  })
  @IsEnum(ProductCategoryCreatedBy)
  created_by: ProductCategoryCreatedBy;
}