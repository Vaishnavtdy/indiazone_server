import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategory } from '../database/models/product-category.model';
import { ProductCategoryImageUploadInterceptor } from './interceptors/product-category-image-upload.interceptor';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ProductCategory]),
    CommonModule,
  ],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService, ProductCategoryImageUploadInterceptor],
  exports: [ProductCategoriesService],
})
export class ProductCategoriesModule {}