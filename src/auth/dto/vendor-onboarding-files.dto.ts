import { ApiProperty } from '@nestjs/swagger';

export class VendorOnboardingFilesDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Logo file (jpg, jpeg, png, gif)',
    required: false,
  })
  logo?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Business registration certificate file (pdf, jpg, jpeg, png)',
    required: false,
  })
  certificate?: Express.Multer.File;
}