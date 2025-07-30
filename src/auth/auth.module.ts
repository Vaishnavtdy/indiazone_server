import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CognitoStrategy } from './strategies/cognito.strategy';
import { UsersModule } from '../users/users.module';
import { VendorProfilesModule } from '../vendor-profiles/vendor-profiles.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'cognito' }),
    UsersModule,
    VendorProfilesModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CognitoStrategy],
  exports: [AuthService],
})
export class AuthModule {}