import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { VendorProfilesModule } from "./vendor-profiles/vendor-profiles.module";
import { DatabaseModule } from "./database/database.module";
import { UnitsModule } from "./units/units.module";
import { BusinessTypesModule } from "./business-types/business-types.module";
import { ProductCategoriesModule } from "./product-categories/product-categories.module";
import { SubscriptionPlansModule } from "./subscription-plans/subscription-plans.module";
import { ProductsModule } from "./products/products.module";
import { CommonModule } from "./common/common.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    VendorProfilesModule,
    UnitsModule,
    BusinessTypesModule,
    ProductCategoriesModule,
    SubscriptionPlansModule,
    ProductsModule,
    CommonModule,
  ],
})
export class AppModule {}
