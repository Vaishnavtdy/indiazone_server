import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitStatus } from '../../database/models/unit.model';

export class UpdateUnitStatusDto {
  @ApiProperty({
    description: 'Unit status',
    enum: UnitStatus,
    example: UnitStatus.APPROVED,
  })
  @IsEnum(UnitStatus)
  status: UnitStatus;
}