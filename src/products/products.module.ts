import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { Product } from "../database/models/product.model";
import { ProductImage } from "../database/models/product-image.model";
import { User } from "../database/models/user.model";
import { ProductCategory } from "../database/models/product-category.model";
import { Unit } from "../database/models/unit.model";
import { ProductSpecification } from "@/database/models/product-specification.model";
import { ProductImageUploadInterceptor } from "./interceptors/product-image-upload.interceptor";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      ProductImage,
      ProductSpecification,
      User,
      ProductCategory,
      Unit,
    ]),
    CommonModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageUploadInterceptor],
  exports: [ProductsService],
})
export class ProductsModule {}
