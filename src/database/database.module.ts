import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "./models/user.model";
import { VendorProfile } from "./models/vendor-profile.model";
import { Unit } from "./models/unit.model";
import { BusinessType } from "./models/business-type.model";
import { ProductCategory } from "./models/product-category.model";
import { SubscriptionPlan } from "./models/subscription-plan.model";
import { Product } from "./models/product.model";
import { ProductImage } from "./models/product-image.model";
import { ProductSpecification } from './models/product-specification.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isSSL = configService.get<string>("DATABASE_SSL") === "true";

        return {
          dialect: "postgres",
          host: configService.get("DATABASE_HOST"),
          port: parseInt(configService.get("DATABASE_PORT"), 10),
          username: configService.get("DATABASE_USERNAME"),
          password: configService.get("DATABASE_PASSWORD"),
          database: configService.get("DATABASE_NAME"),
          models: [User, VendorProfile, Unit, BusinessType, ProductCategory, SubscriptionPlan, Product, ProductImage,ProductSpecification],
          autoLoadModels: true,
          synchronize: false,
          logging: configService.get("NODE_ENV") === "development" ? console.log : false,
          dialectOptions: isSSL
            ? {
                ssl: {
                  require: true,
                  rejectUnauthorized: false, // Use `true` if you add RDS CA cert
                },
              }
            : {},
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
