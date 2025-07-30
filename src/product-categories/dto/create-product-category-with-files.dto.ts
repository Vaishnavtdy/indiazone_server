import { OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { CreateProductCategoryDto } from './create-product-category.dto';

export class CreateProductCategoryWithFilesDto extends OmitType(CreateProductCategoryDto, [
  'image_url',
] as const) {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Category image (jpg, jpeg, png, gif, webp) - Maximum 5MB',
    required: false,
  })
  product_category_image?: Express.Multer.File;
}