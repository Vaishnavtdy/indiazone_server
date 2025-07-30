import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessTypeStatus } from '../../database/models/business-type.model';

export class UpdateBusinessTypeStatusDto {
  @ApiProperty({
    description: 'Business type status',
    enum: BusinessTypeStatus,
    example: BusinessTypeStatus.ACTIVE,
  })
  @IsEnum(BusinessTypeStatus)
  status: BusinessTypeStatus;
}