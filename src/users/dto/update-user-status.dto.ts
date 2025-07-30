import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "../../database/models/user.model";

export class UpdateUserStatusDto {
  @ApiProperty({
    description: "User status",
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({
    description: "Remarks for status update",
    example: "User activated after verification",
    required: false,
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
