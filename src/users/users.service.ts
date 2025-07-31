import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { Op } from "sequelize";
import { ConfigService } from "@nestjs/config";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import * as crypto from "crypto";
import { User, UserStatus } from "../database/models/user.model";
import { VendorProfile } from "../database/models/vendor-profile.model";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import { UserType } from "../database/models/user.model";

@Injectable()
export class UsersService {
  private adminCognitoClient: CognitoIdentityServiceProvider;

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(VendorProfile)
    private vendorProfileModel: typeof VendorProfile,
    private sequelize: Sequelize,
    private configService: ConfigService
  ) {
    this.adminCognitoClient = new CognitoIdentityServiceProvider({
      region: this.configService.get("AWS_REGION"),
      accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
      secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
    });
  }

  private getAdminUserPoolId(): string {
    return this.configService.get("AWS_COGNITO_ADMIN_USER_POOL_ID");
  }

  private getAdminClientId(): string {
    return this.configService.get("AWS_COGNITO_ADMIN_CLIENT_ID");
  }

  private generateAdminSecretHash(username: string): string {
    const clientId = this.getAdminClientId();
    const clientSecret = this.configService.get("AWS_COGNITO_ADMIN_CLIENT_SECRET");
    return crypto
      .createHmac("sha256", clientSecret)
      .update(username + clientId)
      .digest("base64");
  }

  private isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const transaction = await this.sequelize.transaction();

    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        where: {
          email: createUserDto.email,
        },
      });

      if (existingUser) {
        throw new ConflictException({
          message: "User with this email already exists",
          field: "email",
          value: createUserDto.email,
        });
      }

      // Check if Cognito ID already exists
      const existingCognitoUser = await this.userModel.findOne({
        where: {
          aws_cognito_id: createUserDto.aws_cognito_id,
        },
      });

      if (existingCognitoUser) {
        throw new ConflictException({
          message: "User with this Cognito ID already exists",
          field: "aws_cognito_id",
          value: createUserDto.aws_cognito_id,
        });
      }

      const user = await this.userModel.create({ ...createUserDto }, { transaction });

      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createAdminUser(createAdminUserDto: CreateAdminUserDto): Promise<User> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate input
      if (!this.isEmail(createAdminUserDto.email)) {
        throw new ConflictException("Invalid email format");
      }

      if (!this.isPhoneNumber(createAdminUserDto.phone)) {
        throw new ConflictException("Invalid phone number format");
      }

      // Check if user already exists in database
      const existingUser = await this.userModel.findOne({
        where: {
          [Op.or]: [{ email: createAdminUserDto.email }, { phone: createAdminUserDto.phone }],
        },
      });

      if (existingUser) {
        throw new ConflictException({
          message: "User with this email or phone already exists",
          fields: ["email", "phone"],
          values: [createAdminUserDto.email, createAdminUserDto.phone],
        });
      }

      // Format phone number for Cognito
      const formattedPhone = createAdminUserDto.phone.startsWith("+") ? createAdminUserDto.phone : `+${createAdminUserDto.phone}`;

      // Create user in Cognito
      const cognitoParams: any = {
        ClientId: this.getAdminClientId(),
        Username: createAdminUserDto.email,
        Password: createAdminUserDto.password,
        UserAttributes: [
          {
            Name: "email",
            Value: createAdminUserDto.email,
          },
          {
            Name: "phone_number",
            Value: formattedPhone,
          },
          {
            Name: "given_name",
            Value: createAdminUserDto.firstName,
          },
          {
            Name: "family_name",
            Value: createAdminUserDto.lastName,
          },
          {
            Name: "custom:user_type",
            Value: UserType.ADMIN,
          },
        ],
      };

      const secretHash = this.generateAdminSecretHash(createAdminUserDto.email);
      if (secretHash) {
        cognitoParams.SecretHash = secretHash;
      }

      const cognitoResult = await this.adminCognitoClient.signUp(cognitoParams).promise();

      console.log("cognitoResult ===>", cognitoResult);
      

      // Confirm user immediately (admin users don't need email verification)
      await this.adminCognitoClient
        .adminConfirmSignUp({
          UserPoolId: this.getAdminUserPoolId(),
          Username: createAdminUserDto.email,
        })
        .promise();

      // Mark email as verified
      await this.adminCognitoClient
        .adminUpdateUserAttributes({
          UserPoolId: this.getAdminUserPoolId(),
          Username: createAdminUserDto.email,
          UserAttributes: [
            {
              Name: "email_verified",
              Value: "true",
            },
          ],
        })
        .promise();

      // Create user in database
      const createUserDto: CreateUserDto = {
        type: UserType.ADMIN,
        aws_cognito_id: cognitoResult.UserSub,
        first_name: createAdminUserDto.firstName,
        last_name: createAdminUserDto.lastName,
        email: createAdminUserDto.email,
        phone: formattedPhone,
        is_verified: true,
        verified_at: new Date(),
        created_by: 1, // System created
      };

      // const user = await this.userModel.create(createUserDto, { transaction });
      const user = await this.userModel.create(createUserDto as any, { transaction });

      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();

      // Handle Cognito-specific errors
      if (error.code === "UsernameExistsException") {
        throw new ConflictException("User with this email already exists in Cognito");
      } else if (error.code === "InvalidParameterException") {
        throw new ConflictException(`Invalid parameter: ${error.message}`);
      } else if (error.code === "InvalidPasswordException") {
        throw new ConflictException("Password does not meet requirements");
      } else if (error.code === "NotAuthorizedException") {
        throw new ConflictException("Invalid security token or insufficient permissions");
      } else if (error.code === "ResourceNotFoundException") {
        throw new ConflictException("Cognito User Pool not found - check configuration");
      }

      throw error;
    }
  }
  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.userModel.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return {
      users: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: { email },
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findByCognitoId(cognitoId: string): Promise<User> {
    if (!cognitoId) {
      return null;
    }

    return this.userModel.findOne({
      where: { aws_cognito_id: cognitoId },
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
    });
  }

  async findByEmailOrPhone(email?: string, phone?: string): Promise<User> {
    const whereClause: any = {};

    if (email && phone) {
      whereClause[Op.or] = [{ email }, { phone }];
    } else if (email) {
      whereClause.email = email;
    } else if (phone) {
      whereClause.phone = phone;
    } else {
      return null;
    }

    return this.userModel.findOne({
      where: whereClause,
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
    });
  }
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const transaction = await this.sequelize.transaction();

    try {
      const user = await this.findOne(id);

      // Add audit information
      const updateData = {
        ...updateUserDto,
        // updated_by: updatedBy,
      };

      await user.update(updateData, { transaction });

      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStatus(id: number, status: UserStatus, updatedBy?: number, remarks?: string): Promise<User> {
    const transaction = await this.sequelize.transaction();

    try {
      console.log("id ===>", id);

      const user = await this.findOne(id);

      await user.update(
        {
          status,
          updated_by: updatedBy,
          ...(status === UserStatus.ACTIVE && {
            is_verified: true,
            verified_at: new Date(),
          }),

          ...(status === UserStatus.SUSPENDED && {
            is_verified: false,
            rejected_at: new Date(),
            remarks: remarks,
          }),
        },
        { transaction }
      );

      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateVerificationStatus(id: number, isVerified: boolean, updatedBy?: number): Promise<User> {
    const transaction = await this.sequelize.transaction();
    try {
      const user = await this.findOne(id);
      await user.update(
        {
          is_verified: isVerified,
          verified_at: isVerified ? new Date() : null,
          updated_by: updatedBy,
        },
        { transaction }
      );
      await transaction.commit();
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  async remove(id: number): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const user = await this.findOne(id);
      await user.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getUsersByType(userType: string): Promise<User[]> {
    return this.userModel.findAll({
      where: { type: userType },
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async getVendorUsers(): Promise<User[]> {
    return this.userModel.findAll({
      where: { type: "vendor" },
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: true,
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.userModel.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: VendorProfile,
          as: "vendor_profile",
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }
}
