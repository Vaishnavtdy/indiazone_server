import { OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class CreateProductWithFilesDto extends OmitType(CreateProductDto, ['images'] as const) {
  @ApiProperty({
    description: 'Temporary UUID for organizing product images in S3 before product creation',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsString()
  temp_product_uuid: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Product images (jpg, jpeg, png, gif, webp) - Maximum 10 files, 5MB each',
    required: false,
  })
  @IsOptional()
  product_images?: Express.Multer.File[];
}