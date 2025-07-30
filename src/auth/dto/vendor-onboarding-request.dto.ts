import { OmitType } from '@nestjs/swagger';
import { VendorOnboardingDto } from './vendor-onboarding.dto';

export class VendorOnboardingRequestDto extends OmitType(VendorOnboardingDto, [
  'logo',
  'business_registration_certificate',
] as const) {
  // This DTO excludes the file fields (logo and business_registration_certificate)
  // as they will be handled separately as file uploads in multipart/form-data
}