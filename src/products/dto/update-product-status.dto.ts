import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../../database/models/product.model';

export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}