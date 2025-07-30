import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UnitCreatedBy } from '../../database/models/unit.model';

export class CreateUnitDto {
  @ApiProperty({
    description: 'Unit name',
    example: 'Kilogram',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  unit_name: string;

  @ApiProperty({
    description: 'Created by',
    enum: UnitCreatedBy,
    example: UnitCreatedBy.ADMIN,
  })
  @IsEnum(UnitCreatedBy)
  created_by: UnitCreatedBy;
}