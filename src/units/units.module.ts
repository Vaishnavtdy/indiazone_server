import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { Unit } from '../database/models/unit.model';

@Module({
  imports: [SequelizeModule.forFeature([Unit])],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}