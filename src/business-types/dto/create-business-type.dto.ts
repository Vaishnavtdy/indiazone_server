import { IsString, IsEnum, IsNotEmpty, MaxLength, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BusinessTypeCreatedBy, BusinessTypeStatus } from "../../database/models/business-type.model";

export class CreateBusinessTypeDto {
  @ApiProperty({
    description: "Business type name",
    example: "Manufacturing",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  business_type: string;

  @ApiProperty({
    description: "Created by",
    enum: BusinessTypeCreatedBy,
    example: BusinessTypeCreatedBy.ADMIN,
  })
  @IsEnum(BusinessTypeCreatedBy)
  created_by: BusinessTypeCreatedBy;

  @ApiPropertyOptional({
    description: "Status of the business type",
    enum: BusinessTypeStatus,
    example: BusinessTypeStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(BusinessTypeStatus)
  status?: BusinessTypeStatus;
}
