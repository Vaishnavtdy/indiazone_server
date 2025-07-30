// create-product-image.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductImageDto {
  @ApiProperty({
    description: 'URL of the product image',
    example: 'https://s3.amazonaws.com/bucket/image.jpg'
  })
  @IsString()
  @IsUrl()
  image_url: string;

  @ApiProperty({
    description: 'Alternative text for the image',
    example: 'Product Name - Image 1',
    required: false
  })
  @IsOptional()
  @IsString()
  alt_text?: string;

  @ApiProperty({
    description: 'Whether this is the primary image',
    example: true,
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiProperty({
    description: 'Sort order of the image',
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

// update-product-image.dto.ts
export class UpdateProductImageDto extends CreateProductImageDto {
  @ApiProperty({
    description: 'Image ID for updates',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  id?: number;
}