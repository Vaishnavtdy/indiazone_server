import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { UsersService } from "../users/users.service";
import { VendorProfilesService } from "../vendor-profiles/vendor-profiles.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { CreateVendorProfileDto } from "../vendor-profiles/dto/create-vendor-profile.dto";
import { VendorOnboardingRequestDto } from "./dto/vendor-onboarding-request.dto";
import { UserType } from "../database/models/user.model";
import * as crypto from "crypto";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class AuthService {
  private adminCognitoClient: CognitoIdentityServiceProvider;
  private userCognitoClient: CognitoIdentityServiceProvider;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private vendorProfilesService: VendorProfilesService,
    private sequelize: Sequelize
  ) {
    this.adminCognitoClient = new CognitoIdentityServiceProvider({
      region: this.configService.get("AWS_REGION"),
      accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
      secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
    });
    this.userCognitoClient = new CognitoIdentityServiceProvider({
      region: this.configService.get("AWS_REGION"),
      accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
      secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
    });
  }

  private getCognitoClient(userType: UserType): CognitoIdentityServiceProvider {
    return userType === UserType.ADMIN ? this.adminCognitoClient : this.userCognitoClient;
  }

  private getUserPoolId(userType: UserType): string {
    return userType === UserType.ADMIN
      ? this.configService.get("AWS_COGNITO_ADMIN_USER_POOL_ID")
      : this.configService.get("AWS_COGNITO_USER_POOL_ID");
  }

  private getClientId(userType: UserType): string {
    return userType === UserType.ADMIN
      ? this.configService.get("AWS_COGNITO_ADMIN_CLIENT_ID")
      : this.configService.get("AWS_COGNITO_CLIENT_ID");
  }

private generateSecretHash(username: string, userType: UserType): string {
  const clientId = this.getClientId(userType);
  const clientSecret = userType === UserType.ADMIN
    ? this.configService.get('AWS_COGNITO_ADMIN_CLIENT_SECRET')
    : this.configService.get('AWS_COGNITO_CLIENT_SECRET');
  return crypto
    .createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

  private isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  async validateUser(token: string, userType: UserType): Promise<any> {
    try {
      const params = {
        AccessToken: token,
      };

      const cognitoClient = this.getCognitoClient(userType);
      const result = await cognitoClient.getUser(params).promise();

      const email = result.UserAttributes.find((attr) => attr.Name === "email")?.Value;
      const cognitoUserId = result.Username;

      if (!cognitoUserId) {
        throw new UnauthorizedException("Invalid token");
      }

      const user = await this.usersService.findByCognitoId(cognitoUserId);
      if (!user) {
        throw new UnauthorizedException("User not found in database");
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
  
  async signUp(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    userType: UserType,
    password?: string
  ): Promise<any> {
    try {
      const existingUser = await this.usersService.findByEmailOrPhone(email, phone);
      if (existingUser) {
        throw new ConflictException({
          message: "User with this email or phone already exists",
          fields: ["email", "phone"],
          values: [email, phone],
        });
      }

      if (!this.isEmail(email)) {
        throw new BadRequestException("Invalid email format");
      }

      if (!this.isPhoneNumber(phone)) {
        throw new BadRequestException("Invalid phone number format");
      }

      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const isAdmin = userType === UserType.ADMIN;

      const params: any = {
        ClientId: this.getClientId(userType),
        Username: email,
        Password: isAdmin ? password : this.generateTemporaryPassword(),
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
          {
            Name: "phone_number",
            Value: formattedPhone,
          },
          {
            Name: "given_name",
            Value: firstName,
          },
          {
            Name: "family_name",
            Value: lastName,
          },
          {
            Name: "custom:user_type",
            Value: userType,
          },
        ],
      };

      const secretHash = this.generateSecretHash(email, userType);
      if (secretHash) {
        params.SecretHash = secretHash;
      }

      const cognitoClient = this.getCognitoClient(userType);
      const result = await cognitoClient.signUp(params).promise();

      if (isAdmin) {
        await cognitoClient
          .adminConfirmSignUp({
            UserPoolId: this.getUserPoolId(userType),
            Username: email,
          })
          .promise();

        await cognitoClient
          .adminUpdateUserAttributes({
            UserPoolId: this.getUserPoolId(userType),
            Username: email,
            UserAttributes: [
              {
                Name: "email_verified",
                Value: "true",
              },
            ],
          })
          .promise();

        const createUserDto: CreateUserDto = {
          type: userType,
          aws_cognito_id: result.UserSub,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: formattedPhone,
          is_verified: true,
        };

        const createdUser = await this.usersService.create(createUserDto);

        return {
          message: "Admin user registered successfully",
          user: {
            id: createdUser.id,
            email: createdUser.email,
            firstName: createdUser.first_name,
            lastName: createdUser.last_name,
            type: createdUser.type,
          },
        };
      }

      const userData = {
        cognitoUserId: result.UserSub,
        firstName,
        lastName,
        email,
        phone: formattedPhone,
        userType,
      };

      return {
        message: "User registered successfully. Please verify your email.",
        cognitoUserId: result.UserSub,
        verificationRequired: !isAdmin,
        codeDeliveryDetails: result.CodeDeliveryDetails,
      };
    } catch (error) {
      console.error("Signup error:", {
        code: error.code,
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
      });

      if (error.code === "UsernameExistsException") {
        throw new BadRequestException("User with this email already exists");
      } else if (error.code === "InvalidParameterException") {
        throw new BadRequestException(`Invalid parameter: ${error.message}`);
      } else if (error.code === "InvalidPasswordException") {
        throw new BadRequestException("Password does not meet requirements");
      }
      throw new BadRequestException(error.message);
    }
  }

  async adminSignIn(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user || user.type !== UserType.ADMIN) {
        throw new UnauthorizedException("Invalid credentials or user is not an admin");
      }

      const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: this.getClientId(UserType.ADMIN),
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.generateSecretHash(email, UserType.ADMIN),
        },
      };

      const result = await this.adminCognitoClient.initiateAuth(params).promise();

      return {
        message: "Admin sign in successful",
        tokens: {
          accessToken: result.AuthenticationResult.AccessToken,
          idToken: result.AuthenticationResult.IdToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          type: user.type,
        },
      };
    } catch (error) {
      console.error("Admin sign-in error:", {
        code: error.code,
        message: error.message,
        email,
      });
      if (error.code === "NotAuthorizedException") {
        throw new UnauthorizedException("Incorrect email or password");
      } else if (error.code === "UserNotFoundException") {
        throw new UnauthorizedException("User not found in Cognito");
      } else if (error.code === "UserNotConfirmedException") {
        throw new UnauthorizedException("User is not confirmed");
      }
      throw new UnauthorizedException("Invalid credentials");
    }
  }

  async sendVerificationCode(emailOrPhone: string, method: "email" | "phone" = "email"): Promise<any> {
    try {
      let username = emailOrPhone;

      if (method === "phone" || this.isPhoneNumber(emailOrPhone)) {
        const cognitoUserByPhone = await this.findCognitoUserByPhone(emailOrPhone, UserType.CUSTOMER);
        if (cognitoUserByPhone) {
          username = cognitoUserByPhone.email;
        }
      }

      const dbUser = await this.usersService.findByEmailOrPhone(username, emailOrPhone);
      if (dbUser && dbUser.type === UserType.ADMIN) {
        throw new BadRequestException("Admin users use password authentication");
      }

      if (method === "email") {
        const params = {
          ClientId: this.getClientId(UserType.CUSTOMER),
          Username: username,
          SecretHash: this.generateSecretHash(username, UserType.CUSTOMER),
        };

        await this.userCognitoClient.resendConfirmationCode(params).promise();

        return {
          message: "Verification code sent to email",
          method: "email",
        };
      } else {
        const params = {
          UserPoolId: this.getUserPoolId(UserType.CUSTOMER),
          Username: username,
          MessageAction: "RESEND",
          DesiredDeliveryMediums: ["SMS"],
        };

        await this.userCognitoClient.adminCreateUser(params).promise();

        return {
          message: "Verification code sent to phone",
          method: "phone",
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyCode(emailOrPhone: string, code: string, method: "email" | "phone" = "email"): Promise<any> {
    try {
      let username = emailOrPhone;

      if (method === "phone" || this.isPhoneNumber(emailOrPhone)) {
        const cognitoUserByPhone = await this.findCognitoUserByPhone(emailOrPhone, UserType.CUSTOMER);
        if (cognitoUserByPhone) {
          username = cognitoUserByPhone.email;
        }
      }

      const dbUser = await this.usersService.findByEmailOrPhone(username, emailOrPhone);
      if (dbUser && dbUser.type === UserType.ADMIN) {
        throw new BadRequestException("Admin users use password authentication");
      }

      if (method === "email") {
        const params = {
          ClientId: this.getClientId(UserType.CUSTOMER),
          Username: username,
          ConfirmationCode: code,
          SecretHash: this.generateSecretHash(username, UserType.CUSTOMER),
        };

        await this.userCognitoClient.confirmSignUp(params).promise();
      } else {
        const params = {
          UserPoolId: this.getUserPoolId(UserType.CUSTOMER),
          Username: username,
          AttributeName: "phone_number",
          Code: code,
        };

        await this.userCognitoClient.adminConfirmSignUp(params).promise();
      }

      const cognitoUser = await this.getCognitoUser(username, UserType.CUSTOMER);

      const createUserDto: CreateUserDto = {
        type: cognitoUser.userType || UserType.CUSTOMER,
        aws_cognito_id: cognitoUser.cognitoUserId,
        first_name: cognitoUser.firstName,
        last_name: cognitoUser.lastName,
        email: cognitoUser.email,
        phone: cognitoUser.phone,
        is_verified: true,
      };

      const createdUser = await this.usersService.create(createUserDto);

      return {
        message: "Verification successful. Account created.",
        user: {
          id: createdUser.id,
          email: createdUser.email,
          phone: createdUser.phone,
          firstName: createdUser.first_name,
          lastName: createdUser.last_name,
          type: createdUser.type,
        },
      };
    } catch (error) {
      if (error.code === "CodeMismatchException") {
        throw new BadRequestException("Invalid verification code");
      } else if (error.code === "ExpiredCodeException") {
        throw new BadRequestException("Verification code has expired");
      }
      throw new BadRequestException(error.message);
    }
  }

  async signIn(emailOrPhone: string, method: "email" | "phone" = "email"): Promise<any> {
    try {
      let username = emailOrPhone;

      if (this.isEmail(emailOrPhone)) {
        method = "email";
        username = emailOrPhone;
      } else if (this.isPhoneNumber(emailOrPhone)) {
        method = "phone";
        const cognitoUserByPhone = await this.findCognitoUserByPhone(emailOrPhone, UserType.CUSTOMER);
        if (cognitoUserByPhone) {
          username = cognitoUserByPhone.email;
        } else {
          throw new UnauthorizedException("User not found");
        }
      }

      const user = await this.usersService.findByEmailOrPhone(username, emailOrPhone);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      if (user.type === UserType.ADMIN) {
        throw new BadRequestException("Admin users must use password authentication");
      }

      const params = {
        AuthFlow: "CUSTOM_AUTH",
        ClientId: this.getClientId(UserType.CUSTOMER),
        AuthParameters: {
          USERNAME: username,
          SECRET_HASH: this.generateSecretHash(username, UserType.CUSTOMER),
        },
      };

      const result = await this.userCognitoClient.initiateAuth(params).promise();

      await this.sendVerificationCode(emailOrPhone, method);

      return {
        message: `Verification code sent to your ${method}`,
        session: result.Session,
        challengeName: result.ChallengeName,
        method,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async completeSignIn(emailOrPhone: string, code: string, session: string): Promise<any> {
    try {
      let username = emailOrPhone;

      if (this.isPhoneNumber(emailOrPhone)) {
        const cognitoUserByPhone = await this.findCognitoUserByPhone(emailOrPhone, UserType.CUSTOMER);
        if (cognitoUserByPhone) {
          username = cognitoUserByPhone.email;
        }
      }

      const user = await this.usersService.findByEmailOrPhone(username, emailOrPhone);
      if (user.type === UserType.ADMIN) {
        throw new BadRequestException("Admin users use password authentication");
      }

      const params = {
        ClientId: this.getClientId(UserType.CUSTOMER),
        ChallengeName: "CUSTOM_CHALLENGE",
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          ANSWER: code,
          SECRET_HASH: this.generateSecretHash(username, UserType.CUSTOMER),
        },
      };

      const result = await this.userCognitoClient.respondToAuthChallenge(params).promise();

      return {
        message: "Sign in successful",
        tokens: {
          accessToken: result.AuthenticationResult.AccessToken,
          idToken: result.AuthenticationResult.IdToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
        },
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          type: user.type,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private generateTemporaryPassword(): string {
    const length = 12;
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()";
    const allChars = upperCase + lowerCase + numbers + specialChars;

    let password = "";
    // Ensure at least one character from each required category
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to randomize character positions
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
    return password;
  }

  private async findCognitoUserByPhone(phone: string, userType: UserType): Promise<any> {
    try {
      const params = {
        UserPoolId: this.getUserPoolId(userType),
        Filter: `phone_number = "${phone}"`,
      };

      const result = await this.getCognitoClient(userType).listUsers(params).promise();

      if (result.Users && result.Users.length > 0) {
        const user = result.Users[0];
        const email = user.Attributes.find((attr) => attr.Name === "email")?.Value;
        const firstName = user.Attributes.find((attr) => attr.Name === "given_name")?.Value;
        const lastName = user.Attributes.find((attr) => attr.Name === "family_name")?.Value;

        return {
          cognitoUserId: user.Username,
          email,
          phone,
          firstName,
          lastName,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async getCognitoUser(username: string, userType: UserType): Promise<any> {
    try {
      const params = {
        UserPoolId: this.getUserPoolId(userType),
        Username: username,
      };
      const result = await this.getCognitoClient(userType).adminGetUser(params).promise();
      const email = result.UserAttributes.find((attr) => attr.Name === "email")?.Value;
      const phone = result.UserAttributes.find((attr) => attr.Name === "phone_number")?.Value;
      const firstName = result.UserAttributes.find((attr) => attr.Name === "given_name")?.Value;
      const lastName = result.UserAttributes.find((attr) => attr.Name === "family_name")?.Value;
      const userTypeAttr = result.UserAttributes.find((attr) => attr.Name === "custom:user_type")?.Value;
      return {
        cognitoUserId: result.Username,
        email,
        phone,
        firstName,
        lastName,
        userType: userTypeAttr,
      };
    } catch (error) {
      throw new NotFoundException("Error getting user from Cognito");
    }
  }

  async onboardVendor(vendorOnboardingDto: VendorOnboardingRequestDto, logoUrl?: string, certificateUrl?: string): Promise<any> {
    const transaction = await this.sequelize.transaction();

    try {
      let existingUser = null;

      if (vendorOnboardingDto.aws_cognito_id) {
        existingUser = await this.usersService.findByCognitoId(vendorOnboardingDto.aws_cognito_id);
      }

      if (!existingUser && vendorOnboardingDto.email) {
        try {
          existingUser = await this.usersService.findByEmail(vendorOnboardingDto.email);
        } catch (error) {
          // User not found by email, which is fine
        }
      }

      let createdUser = existingUser;
      if (!existingUser) {
        const createUserDto: CreateUserDto = {
          type: vendorOnboardingDto.type,
          aws_cognito_id: vendorOnboardingDto.aws_cognito_id || "",
          first_name: vendorOnboardingDto.first_name,
          last_name: vendorOnboardingDto.last_name,
          email: vendorOnboardingDto.email,
          phone: vendorOnboardingDto.phone,
          post_code: vendorOnboardingDto.post_code,
          country: vendorOnboardingDto.country,
          city: vendorOnboardingDto.city,
          is_verified: vendorOnboardingDto.is_verified || false,
          verified_at: vendorOnboardingDto.verified_at,
          is_profile_updated: vendorOnboardingDto.is_profile_updated || false,
          created_by: 1,
        };

        createdUser = await this.usersService.create(createUserDto);
      }

      const createVendorProfileDto: CreateVendorProfileDto = {
        user_id: createdUser.id,
        business_type: vendorOnboardingDto.business_type,
        business_name: vendorOnboardingDto.business_name,
        company_name: vendorOnboardingDto.company_name,
        contact_person: vendorOnboardingDto.contact_person,
        designation: vendorOnboardingDto.designation,
        country: vendorOnboardingDto.country,
        city: vendorOnboardingDto.city,
        website: vendorOnboardingDto.website,
        business_registration_certificate: certificateUrl,
        gst_number: vendorOnboardingDto.gst_number,
        address: vendorOnboardingDto.address,
        company_details: vendorOnboardingDto.company_details,
        whatsapp_number: vendorOnboardingDto.whatsapp_number,
        logo: logoUrl,
        working_days: vendorOnboardingDto.working_days,
        employee_count: vendorOnboardingDto.employee_count,
        payment_mode: vendorOnboardingDto.payment_mode,
        establishment: vendorOnboardingDto.establishment,
        created_by: 1,
      };

      const vendorProfile = await this.vendorProfilesService.create(createVendorProfileDto);

      await transaction.commit();

      return {
        message: "Vendor onboarding completed successfully",
        user: {
          id: createdUser.id,
          email: createdUser.email,
          phone: createdUser.phone,
          firstName: createdUser.first_name,
          lastName: createdUser.last_name,
          type: createdUser.type,
          isVerified: createdUser.is_verified,
          isProfileUpdated: createdUser.is_profile_updated,
        },
        vendorProfile: {
          id: vendorProfile.id,
          businessName: vendorProfile.business_name,
          companyName: vendorProfile.company_name,
          businessType: vendorProfile.business_type,
          website: vendorProfile.website,
        },
      };
    } catch (error) {
      await transaction.rollback();

      if (error.message?.includes("already exists")) {
        throw new ConflictException("User or vendor profile already exists");
      }

      throw error;
    }
  }
}

// import { Injectable, NotFoundException, ConflictException,BadRequestException,UnauthorizedException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { CognitoIdentityServiceProvider } from 'aws-sdk';
// import { UsersService } from '../users/users.service';
// import { VendorProfilesService } from '../vendor-profiles/vendor-profiles.service';
// import { CreateUserDto } from '../users/dto/create-user.dto';
// import { CreateVendorProfileDto } from '../vendor-profiles/dto/create-vendor-profile.dto';
// import { VendorOnboardingRequestDto } from './dto/vendor-onboarding-request.dto';
// import { UserType } from '../database/models/user.model';
// import * as crypto from 'crypto';
// import { log } from 'console';
// import { Sequelize } from 'sequelize-typescript';

// @Injectable()
// export class AuthService {
//   private cognitoClient: CognitoIdentityServiceProvider;

//   constructor(
//     private configService: ConfigService,
//     private usersService: UsersService,
//     private vendorProfilesService: VendorProfilesService,
//     private sequelize: Sequelize,
//   ) {
//     this.cognitoClient = new CognitoIdentityServiceProvider({
//       region: this.configService.get('AWS_REGION'),
//       accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
//       secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
//     });
//   }

//   private generateSecretHash(username: string): string {
//     const clientId = this.configService.get('AWS_COGNITO_CLIENT_ID');
//     const clientSecret = this.configService.get('AWS_COGNITO_CLIENT_SECRET');

//     const message = username + clientId;
//     const hmac = crypto.createHmac('sha256', clientSecret);
//     hmac.update(message);
//     return hmac.digest('base64');
//   }

//   private isEmail(input: string): boolean {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(input);
//   }

//   private isPhoneNumber(input: string): boolean {
//     const phoneRegex = /^\+?[1-9]\d{1,14}$/;
//     return phoneRegex.test(input.replace(/[\s\-\(\)]/g, ''));
//   }

//   async validateUser(token: string): Promise<any> {
//     try {
//       const params = {
//         AccessToken: token,
//       };

//       const result = await this.cognitoClient.getUser(params).promise();

//       // Extract user information from Cognito response
//       const email = result.UserAttributes.find(attr => attr.Name === 'email')?.Value;
//       const phone = result.UserAttributes.find(attr => attr.Name === 'phone_number')?.Value;
//       const cognitoUserId = result.Username;

//       if (!cognitoUserId) {
//         throw new UnauthorizedException('Invalid token');
//       }
//       // Get user from our database
//       const user = await this.usersService.findByCognitoId(cognitoUserId);
//       if (!user) {
//         throw new UnauthorizedException('User not found in database');
//       }
//       return user;
//     } catch (error) {
//       throw new UnauthorizedException('Invalid token');
//     }
//   }

// /**
//  * Step 1: Sign up - Register user in Cognito with passwordless flow
//  */
//   async signUp(firstName: string, lastName: string, email: string, phone: string, userType: UserType): Promise<any> {
//     try {
//       // First, check if user already exists in our database
//       const existingUser = await this.usersService.findByEmailOrPhone(email, phone);
//       if (existingUser) {
//         throw new ConflictException({
//           message: 'User with this email or phone already exists',
//           fields: ['email', 'phone'],
//           values: [email, phone],
//         });
//       }

//     // Validate input
//     if (!this.isEmail(email)) {
//       throw new BadRequestException('Invalid email format');
//     }

//     if (!this.isPhoneNumber(phone)) {
//       throw new BadRequestException('Invalid phone number format');
//     }
//      // Create user in Cognito with temporary password
//       const tempPassword = this.generateTemporaryPassword();

//     // Format phone number for Cognito (must include country code)
//     const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

//     console.log('Creating user with params:', {
//       email,
//       phone: formattedPhone,
//       firstName,
//       lastName,
//       userType
//     });

//     // For passwordless flow, we should use the regular signup, not admin create user
//     const params: any = {
//       ClientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
//       Username: email, // Use email as username
//       Password: tempPassword,
//       UserAttributes: [
//         {
//           Name: 'email',
//           Value: email,
//         },
//         {
//           Name: 'phone_number',
//           Value: formattedPhone,
//         },
//         {
//           Name: 'given_name',
//           Value: firstName,
//         },
//         {
//           Name: 'family_name',
//           Value: lastName,
//         },
//         {
//           Name: 'custom:user_type',
//           Value: userType,
//         },
//       ],

//     };

//     // Only add SecretHash if client secret is configured
//     const secretHash = this.generateSecretHash(email);
//     if (secretHash) {
//       params.SecretHash = secretHash;
//     }

//     const result = await this.cognitoClient.signUp(params).promise();

//     console.log('Cognito signup result:', {
//       UserSub: result.UserSub,
//       CodeDeliveryDetails: result.CodeDeliveryDetails
//     });

//     // Store user data temporarily in memory or cache
//     // (You might want to use a proper cache like Redis for production)
//     const userData = {
//       cognitoUserId: result.UserSub,
//       firstName,
//       lastName,
//       email,
//       phone: formattedPhone,
//       userType,
//     };

//     // Store this temporarily - you might want to use a proper cache
//     // For now, we'll assume the verification step will handle user creation

//     return {
//       message: 'User registered successfully. Please verify your email.',
//       cognitoUserId: result.UserSub,
//       verificationRequired: true,
//       codeDeliveryDetails: result.CodeDeliveryDetails,
//     };
//   } catch (error) {
//     console.error('Signup error:', {
//       code: error.code,
//       message: error.message,
//       name: error.name,
//       statusCode: error.statusCode
//     });

//     // Handle specific Cognito errors
//     if (error.code === 'UsernameExistsException') {
//       throw new BadRequestException('User with this email already exists');
//     } else if (error.code === 'InvalidParameterException') {
//       throw new BadRequestException(`Invalid parameter: ${error.message}`);
//     } else if (error.code === 'InvalidPasswordException') {
//       throw new BadRequestException('Password does not meet requirements');
//     } else if (error.code === 'NotAuthorizedException') {
//       throw new BadRequestException('Invalid security token or insufficient permissions');
//     } else if (error.code === 'ResourceNotFoundException') {
//       throw new BadRequestException('Cognito User Pool not found - check configuration');
//     }

//     throw new BadRequestException(error.message);
//   }
//   }

//   /**
//    * Step 2: Send verification code via email or SMS
//    */
//   async sendVerificationCode(emailOrPhone: string, method: 'email' | 'phone' = 'email'): Promise<any> {
//     try {
//       let username = emailOrPhone;

//       // If it's a phone number, find the user by phone to get the email (username)
//       if (method === 'phone' || this.isPhoneNumber(emailOrPhone)) {
//         // For phone verification, we need to use the email as username
//         // This is a limitation of Cognito - we'll need to find the user first
//         const user = await this.findCognitoUserByPhone(emailOrPhone);
//         if (user) {
//           username = user.email;
//         }
//       }

//       if (method === 'email') {
//         // Send email verification
//         const params = {
//           ClientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
//           Username: username,
//           SecretHash: this.generateSecretHash(username),
//         };

//         await this.cognitoClient.resendConfirmationCode(params).promise();

//         return {
//           message: 'Verification code sent to email',
//           method: 'email',
//         };
//       } else {
//         // Send SMS verification
//         const params = {
//           UserPoolId: this.configService.get('AWS_COGNITO_USER_POOL_ID'),
//           Username: username,
//           MessageAction: 'RESEND',
//           DesiredDeliveryMediums: ['SMS'],
//         };

//         await this.cognitoClient.adminCreateUser(params).promise();

//         return {
//           message: 'Verification code sent to phone',
//           method: 'phone',
//         };
//       }
//     } catch (error) {
//       throw new BadRequestException(error.message);
//     }
//   }

//   /**
//    * Step 3: Verify code and complete registration
//    */
//   async verifyCode(emailOrPhone: string, code: string, method: 'email' | 'phone' = 'email'): Promise<any> {
//     try {
//       let username = emailOrPhone;

//       // If it's a phone number, find the user by phone to get the email (username)
//       if (method === 'phone' || this.isPhoneNumber(emailOrPhone)) {
//         const user = await this.findCognitoUserByPhone(emailOrPhone);
//         if (user) {
//           username = user.email;
//         }
//       }

//       if (method === 'email') {
//         // Verify email code
//         const params = {
//           ClientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
//           Username: username,
//           ConfirmationCode: code,
//           SecretHash: this.generateSecretHash(username),
//         };

//         await this.cognitoClient.confirmSignUp(params).promise();
//       } else {
//         // Verify phone code
//         const params = {
//           UserPoolId: this.configService.get('AWS_COGNITO_USER_POOL_ID'),
//           Username: username,
//           AttributeName: 'phone_number',
//           Code: code,
//         };

//         await this.cognitoClient.adminConfirmSignUp(params).promise();
//       }

//       // Get user details from Cognito
//       const cognitoUser = await this.getCognitoUser(username);
//       console.log(cognitoUser)

//       // Create user in our database
//       const createUserDto: CreateUserDto = {
//         type: cognitoUser.userType|| UserType.CUSTOMER,
//         aws_cognito_id: cognitoUser.cognitoUserId,
//         first_name: cognitoUser.firstName,
//         last_name: cognitoUser.lastName,
//         email: cognitoUser.email,
//         phone: cognitoUser.phone,
//         is_verified: false,
//       };

//       const user = await this.usersService.create(createUserDto);

//       return {
//         message: 'Verification successful. Account created.',
//         user: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           firstName: user.first_name,
//           lastName: user.last_name,
//           type: user.type,
//         },
//       };
//     } catch (error) {
//       if (error.code === 'CodeMismatchException') {
//         throw new BadRequestException('Invalid verification code');
//       } else if (error.code === 'ExpiredCodeException') {
//         throw new BadRequestException('Verification code has expired');
//       }
//       throw new BadRequestException(error.message);
//     }
//   }

//   /**
//    * Step 4: Passwordless sign in
//    */
//   async signIn(emailOrPhone: string, method: 'email' | 'phone' = 'email'): Promise<any> {
//     try {
//       let username = emailOrPhone;

//       // Determine if input is email or phone
//       if (this.isEmail(emailOrPhone)) {
//         method = 'email';
//         username = emailOrPhone;
//       } else if (this.isPhoneNumber(emailOrPhone)) {
//         method = 'phone';
//         // Find user by phone to get email (username)
//         const user = await this.findCognitoUserByPhone(emailOrPhone);
//         if (user) {
//           username = user.email;
//         } else {
//           throw new UnauthorizedException('User not found');
//         }
//       }

//       // Check if user exists in our database
//       const user = await this.usersService.findByEmailOrPhone(username, emailOrPhone);
//       if (!user) {
//         throw new UnauthorizedException('User not found');
//       }

//       // Initiate passwordless authentication
//       const params = {
//         AuthFlow: 'CUSTOM_AUTH',
//         ClientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
//         AuthParameters: {
//           USERNAME: username,
//           SECRET_HASH: this.generateSecretHash(username),
//         },
//       };

//       const result = await this.cognitoClient.initiateAuth(params).promise();

//       // Send verification code
//       await this.sendVerificationCode(emailOrPhone, method);

//       return {
//         message: `Verification code sent to your ${method}`,
//         session: result.Session,
//         challengeName: result.ChallengeName,
//         method,
//       };
//     } catch (error) {
//       throw new UnauthorizedException(error.message);
//     }
//   }

//   /**
//    * Step 5: Complete passwordless sign in
//    */
//   async completeSignIn(emailOrPhone: string, code: string, session: string): Promise<any> {
//     try {
//       let username = emailOrPhone;

//       if (this.isPhoneNumber(emailOrPhone)) {
//         const user = await this.findCognitoUserByPhone(emailOrPhone);
//         if (user) {
//           username = user.email;
//         }
//       }

//       const params = {
//         ClientId: this.configService.get('AWS_COGNITO_CLIENT_ID'),
//         ChallengeName: 'CUSTOM_CHALLENGE',
//         Session: session,
//         ChallengeResponses: {
//           USERNAME: username,
//           ANSWER: code,
//           SECRET_HASH: this.generateSecretHash(username),
//         },
//       };

//       const result = await this.cognitoClient.respondToAuthChallenge(params).promise();

//       // Get user from database
//       const user = await this.usersService.findByEmailOrPhone(username, emailOrPhone);

//       return {
//         message: 'Sign in successful',
//         tokens: {
//           accessToken: result.AuthenticationResult.AccessToken,
//           idToken: result.AuthenticationResult.IdToken,
//           refreshToken: result.AuthenticationResult.RefreshToken,
//         },
//         user: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           firstName: user.first_name,
//           lastName: user.last_name,
//           type: user.type,
//         },
//       };
//     } catch (error) {
//       throw new UnauthorizedException(error.message);
//     }
//   }

//   // Helper methods
//   private generateTemporaryPassword(): string {
//     const length = 13;
//     const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
//     let password = '';
//     for (let i = 0; i < length; i++) {
//       password += charset.charAt(Math.floor(Math.random() * charset.length));
//     }
//     return password;
//   }

//   private async findCognitoUserByPhone(phone: string): Promise<any> {
//     try {
//       const params = {
//         UserPoolId: this.configService.get('AWS_COGNITO_USER_POOL_ID'),
//         Filter: `phone_number = "${phone}"`,
//       };

//       const result = await this.cognitoClient.listUsers(params).promise();

//       if (result.Users && result.Users.length > 0) {
//         const user = result.Users[0];
//         const email = user.Attributes.find(attr => attr.Name === 'email')?.Value;
//         const firstName = user.Attributes.find(attr => attr.Name === 'given_name')?.Value;
//         const lastName = user.Attributes.find(attr => attr.Name === 'family_name')?.Value;

//         return {
//           cognitoUserId: user.Username,
//           email,
//           phone,
//           firstName,
//           lastName,
//         };
//       }

//       return null;
//     } catch (error) {
//       return null;
//     }
//   }

//   private async getCognitoUser(username: string): Promise<any> {
//     console.log(username)
//     try {
//       const params = {
//         UserPoolId: this.configService.get('AWS_COGNITO_USER_POOL_ID'),
//         Username: username,

//       };
//       console.log(params)
//       const result = await this.cognitoClient.adminGetUser(params).promise();
//       console.log(result)
//       const email = result.UserAttributes.find(attr => attr.Name === 'email')?.Value;
//       const phone = result.UserAttributes.find(attr => attr.Name === 'phone_number')?.Value;
//       const firstName = result.UserAttributes.find(attr => attr.Name === 'given_name')?.Value;
//       const lastName = result.UserAttributes.find(attr => attr.Name === 'family_name')?.Value;
//       const userType = result.UserAttributes.find(attr => attr.Name === 'custom:user_type')?.Value;
//       return {
//         cognitoUserId: result.Username,
//         email,
//         phone,
//         firstName,
//         lastName,
//         userType: userType
//       };
//     } catch (error) {
//       console.log(error)
//       throw new NotFoundException('eror getting User not found in Cognito');
//     }
//   }

//   /**
//    * Complete vendor onboarding - creates both user and vendor profile
//    */
//   async onboardVendor(
//     vendorOnboardingDto: VendorOnboardingRequestDto,
//     logoUrl?: string,
//     certificateUrl?: string
//   ): Promise<any> {
//     const transaction = await this.sequelize.transaction();

//     try {
//       // Check if user already exists
//       let user = null;

//       if (vendorOnboardingDto.aws_cognito_id) {
//         user = await this.usersService.findByCognitoId(vendorOnboardingDto.aws_cognito_id);
//       }

//       if (!user && vendorOnboardingDto.email) {
//         try {
//           user = await this.usersService.findByEmail(vendorOnboardingDto.email);
//         } catch (error) {
//           // User not found by email, which is fine
//         }
//       }

//       // If user doesn't exist, create new user
//       if (!user) {
//         const createUserDto: CreateUserDto = {
//           type: vendorOnboardingDto.type,
//           aws_cognito_id: vendorOnboardingDto.aws_cognito_id || '',
//           first_name: vendorOnboardingDto.first_name,
//           last_name: vendorOnboardingDto.last_name,
//           email: vendorOnboardingDto.email,
//           phone: vendorOnboardingDto.phone,
//           post_code: vendorOnboardingDto.post_code,
//           country: vendorOnboardingDto.country,
//           city: vendorOnboardingDto.city,
//           is_verified: vendorOnboardingDto.is_verified || false,
//           verified_at: vendorOnboardingDto.verified_at,
//           is_profile_updated: vendorOnboardingDto.is_profile_updated || false,
//           created_by: 1, // System created
//         };

//         user = await this.usersService.create(createUserDto);
//       }

//       // Create vendor profile
//       const createVendorProfileDto: CreateVendorProfileDto = {
//         user_id: user.id,
//         business_type: vendorOnboardingDto.business_type,
//         business_name: vendorOnboardingDto.business_name,
//         company_name: vendorOnboardingDto.company_name,
//         contact_person: vendorOnboardingDto.contact_person,
//         designation: vendorOnboardingDto.designation,
//         country: vendorOnboardingDto.country,
//         city: vendorOnboardingDto.city,
//         website: vendorOnboardingDto.website,
//         business_registration_certificate: certificateUrl,
//         gst_number: vendorOnboardingDto.gst_number,
//         address: vendorOnboardingDto.address,
//         company_details: vendorOnboardingDto.company_details,
//         whatsapp_number: vendorOnboardingDto.whatsapp_number,
//         logo: logoUrl,
//         working_days: vendorOnboardingDto.working_days,
//         employee_count: vendorOnboardingDto.employee_count,
//         payment_mode: vendorOnboardingDto.payment_mode,
//         establishment: vendorOnboardingDto.establishment,
//         created_by: 1, // System created
//       };

//       const vendorProfile = await this.vendorProfilesService.create(createVendorProfileDto);

//       await transaction.commit();

//       return {
//         message: 'Vendor onboarding completed successfully',
//         user: {
//           id: user.id,
//           email: user.email,
//           phone: user.phone,
//           firstName: user.first_name,
//           lastName: user.last_name,
//           type: user.type,
//           isVerified: user.is_verified,
//           isProfileUpdated: user.is_profile_updated,
//         },
//         vendorProfile: {
//           id: vendorProfile.id,
//           businessName: vendorProfile.business_name,
//           companyName: vendorProfile.company_name,
//           businessType: vendorProfile.business_type,
//           website: vendorProfile.website,
//         },
//       };
//     } catch (error) {
//       await transaction.rollback();

//       if (error.message?.includes('already exists')) {
//         throw new ConflictException('User or vendor profile already exists');
//       }

//       throw error;
//     }
//   }
// }
