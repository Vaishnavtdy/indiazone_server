import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({
    description: 'User email address or phone number',
    example: 'user@example.com',
  })
  @IsString()
  emailOrPhone: string;

  @ApiProperty({
    description: 'Verification code',
    example: '123456',
  })
  @IsString()
  verificationCode: string;

  @ApiProperty({
    description: 'Verification method',
    example: 'email',
    enum: ['email', 'phone'],
  })
  @IsString()
  @IsOptional()
  verificationMethod?: 'email' | 'phone';
}