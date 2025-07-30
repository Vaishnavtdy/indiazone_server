import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BusinessTypesService } from './business-types.service';
import { BusinessTypesController } from './business-types.controller';
import { BusinessType } from '../database/models/business-type.model';

@Module({
  imports: [SequelizeModule.forFeature([BusinessType])],
  controllers: [BusinessTypesController],
  providers: [BusinessTypesService],
  exports: [BusinessTypesService],
})
export class BusinessTypesModule {}