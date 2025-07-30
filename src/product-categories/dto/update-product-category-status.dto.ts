import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategoryStatus } from '../../database/models/product-category.model';

export class UpdateProductCategoryStatusDto {
  @ApiProperty({
    description: 'Product category status',
    enum: ProductCategoryStatus,
    example: ProductCategoryStatus.APPROVED,
  })
  @IsEnum(ProductCategoryStatus)
  status: ProductCategoryStatus;
}