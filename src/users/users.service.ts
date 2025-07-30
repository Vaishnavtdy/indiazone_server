import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { Op } from "sequelize";
import { User, UserStatus } from "../database/models/user.model";
import { VendorProfile } from "../database/models/vendor-profile.model";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(VendorProfile)
    private vendorProfileModel: typeof VendorProfile,
    private sequelize: Sequelize
  ) {}

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
