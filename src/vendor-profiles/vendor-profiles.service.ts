import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { VendorProfile } from '../database/models/vendor-profile.model';
import { User } from '../database/models/user.model';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';

@Injectable()
export class VendorProfilesService {
  constructor(
    @InjectModel(VendorProfile)
    private vendorProfileModel: typeof VendorProfile,
    @InjectModel(User)
    private userModel: typeof User,
    private sequelize: Sequelize,
  ) {}

  async create(createVendorProfileDto: CreateVendorProfileDto): Promise<VendorProfile> {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Check if user exists
      const user = await this.userModel.findByPk(createVendorProfileDto.user_id);
      if (!user) {
        throw new NotFoundException(`User with ID ${createVendorProfileDto.user_id} not found`);
      }

      // Check if vendor profile already exists for this user
      const existingProfile = await this.vendorProfileModel.findOne({
        where: { user_id: createVendorProfileDto.user_id },
      });

      if (existingProfile) {
        throw new ConflictException({
          message: 'Vendor profile already exists for this user',
          field: 'user_id',
          value: createVendorProfileDto.user_id,
        });
      }

      const vendorProfile = await this.vendorProfileModel.create({...createVendorProfileDto}, { transaction });
      
      // Update user profile status
      await user.update({ is_profile_updated: true }, { transaction });
      
      await transaction.commit();
      
      return this.findOne(vendorProfile.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ profiles: VendorProfile[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.vendorProfileModel.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return {
      profiles: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<VendorProfile> {
    const vendorProfile = await this.vendorProfileModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status'],
        },
      ],
    });

    if (!vendorProfile) {
      throw new NotFoundException(`Vendor profile with ID ${id} not found`);
    }

    return vendorProfile;
  }

  async findByUserId(userId: number): Promise<VendorProfile> {
    const vendorProfile = await this.vendorProfileModel.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status'],
        },
      ],
    });

    if (!vendorProfile) {
      throw new NotFoundException(`Vendor profile for user ID ${userId} not found`);
    }

    return vendorProfile;
  }

  async update(id: number, updateVendorProfileDto: UpdateVendorProfileDto, updatedBy?: number): Promise<VendorProfile> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const vendorProfile = await this.findOne(id);
      
      // Add audit information
      const updateData = {
        ...updateVendorProfileDto,
        updated_by: updatedBy,
      };

      await vendorProfile.update(updateData, { transaction });
      
      await transaction.commit();
      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const vendorProfile = await this.findOne(id);
      
      // Update user profile status
      await this.userModel.update(
        { is_profile_updated: false },
        { where: { id: vendorProfile.user_id }, transaction }
      );
      
      await vendorProfile.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async searchProfiles(query: string): Promise<VendorProfile[]> {
    return this.vendorProfileModel.findAll({
      where: {
        [Op.or]: [
          { business_name: { [Op.iLike]: `%${query}%` } },
          { company_name: { [Op.iLike]: `%${query}%` } },
          { contact_person: { [Op.iLike]: `%${query}%` } },
          { business_type: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getProfilesByBusinessType(businessType: string): Promise<VendorProfile[]> {
    return this.vendorProfileModel.findAll({
      where: { business_type: businessType },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getProfilesByCountry(country: string): Promise<VendorProfile[]> {
    return this.vendorProfileModel.findAll({
      where: { country },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async updateFiles(id: number, files: { logo?: string; certificate?: string }, updatedBy?: number): Promise<VendorProfile> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const vendorProfile = await this.findOne(id);
      
      const updateData: any = { updated_by: updatedBy };
      
      if (files.logo) {
        updateData.logo = files.logo;
      }
      
      if (files.certificate) {
        updateData.business_registration_certificate = files.certificate;
      }

      await vendorProfile.update(updateData, { transaction });
      
      await transaction.commit();
      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}