import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../database/models/user.model';
import { VendorProfile } from '../database/models/vendor-profile.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User, VendorProfile]),
    ConfigModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}