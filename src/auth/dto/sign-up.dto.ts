import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { UserType } from '../../database/models/user.model';

export class SignUpDto {
  @ApiProperty({ description: 'First name of the user' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number of the user' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'User type (vendor, customer, or admin)', enum: UserType })
  @IsString()
  userType: UserType;

  @ApiProperty({ description: 'Password (required for admin users)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

// import { IsEmail, IsString, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';
// import { UserType } from '../../database/models/user.model';

// export class SignUpDto {
//   @ApiProperty({
//     description: 'User first name',
//     example: 'John',
//   })
//   @IsString()
//   firstName: string;

//   @ApiProperty({
//     description: 'User last name',
//     example: 'Doe',
//   })
//   @IsString()
//   lastName: string;

//   @ApiProperty({
//     description: 'User email address',
//     example: 'user@example.com',
//   })
//   @IsEmail()
//   email: string;

//   @ApiProperty({
//     description: 'User phone number',
//     example: '+1234567890',
//   })
//   @IsPhoneNumber()
//   phone: string;

//   @ApiProperty({
//     description: 'User type',
//     enum: UserType,
//     example: UserType.CUSTOMER,
//   })
//   @IsEnum(UserType)
//   userType: UserType;
// }