import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VendorOnboardingRequestDto } from './dto/vendor-onboarding-request.dto';
import { VendorOnboardingFilesDto } from './dto/vendor-onboarding-files.dto';
import { S3FileUploadInterceptor } from '../common/interceptors/s3-file-upload.interceptor';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user (passwordless)' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(
      signUpDto.firstName,
      signUpDto.lastName,
      signUpDto.email,
      signUpDto.phone,
      signUpDto.userType,
    );
  }

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send verification code via email or SMS' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendVerificationCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.sendVerificationCode(
      resendCodeDto.emailOrPhone,
      resendCodeDto.verificationMethod,
    );
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify code and complete registration' })
  @ApiResponse({ status: 200, description: 'Verification successful and account created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(
      verifyCodeDto.emailOrPhone,
      verifyCodeDto.verificationCode,
      verifyCodeDto.verificationMethod,
    );
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate passwordless sign in' })
  @ApiResponse({ status: 200, description: 'Verification code sent for sign in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(
      signInDto.emailOrPhone,
      signInDto.verificationMethod,
    );
  }

  @Post('complete-sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete passwordless sign in with verification code' })
  @ApiResponse({ status: 200, description: 'Sign in successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeSignIn(@Body() body: { emailOrPhone: string; code: string; session: string }) {
    return this.authService.completeSignIn(
      body.emailOrPhone,
      body.code,
      body.session,
    );
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Verification code resent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resendCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.sendVerificationCode(
      resendCodeDto.emailOrPhone,
      resendCodeDto.verificationMethod,
    );
  }

  @Post('vendor-onboarding')
  @UseInterceptors(S3FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Complete vendor onboarding (user + vendor profile creation)' })
  @ApiResponse({ status: 201, description: 'Vendor successfully onboarded' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async vendorOnboarding(
    @Body() vendorOnboardingDto: VendorOnboardingRequestDto,
    @UploadedFiles() files: { 
      logo?: Express.Multer.File[], 
      certificate?: Express.Multer.File[] 
    },
  ) {
    // Extract file URLs from uploaded files
    const logoUrl = files.logo && files.logo[0] ? (files.logo[0] as any).location : undefined;
    const certificateUrl = files.certificate && files.certificate[0] ? (files.certificate[0] as any).location : undefined;

    return this.authService.onboardVendor(vendorOnboardingDto, logoUrl, certificateUrl);
  }
}