import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'Custom name for the file (optional)',
    example: 'my_custom_filename',
    required: false,
  })
  custom_name?: string;
}

export class VendorFileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Logo file (jpg, jpeg, png, gif)',
    required: false,
  })
  logo?: Express.Multer.File;

  @ApiProperty({
    description: 'Custom name for logo file',
    example: 'company_logo',
    required: false,
  })
  logo_name?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Certificate file (pdf, jpg, jpeg, png)',
    required: false,
  })
  certificate?: Express.Multer.File;

  @ApiProperty({
    description: 'Custom name for certificate file',
    example: 'business_registration',
    required: false,
  })
  certificate_name?: string;
}