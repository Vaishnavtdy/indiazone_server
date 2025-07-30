import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessTypeCreatedBy } from '../../database/models/business-type.model';

export class CreateBusinessTypeDto {
  @ApiProperty({
    description: 'Business type name',
    example: 'Manufacturing',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  business_type: string;

  @ApiProperty({
    description: 'Created by',
    enum: BusinessTypeCreatedBy,
    example: BusinessTypeCreatedBy.ADMIN,
  })
  @IsEnum(BusinessTypeCreatedBy)
  created_by: BusinessTypeCreatedBy;
}