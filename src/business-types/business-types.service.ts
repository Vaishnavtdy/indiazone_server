import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BusinessType, BusinessTypeStatus } from '../database/models/business-type.model';
import { CreateBusinessTypeDto } from './dto/create-business-type.dto';
import { UpdateBusinessTypeDto } from './dto/update-business-type.dto';

@Injectable()
export class BusinessTypesService {
  constructor(
    @InjectModel(BusinessType)
    private businessTypeModel: typeof BusinessType,
    private sequelize: Sequelize,
  ) {}

  async create(createBusinessTypeDto: CreateBusinessTypeDto): Promise<BusinessType> {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Check if business type already exists
      const existingBusinessType = await this.businessTypeModel.findOne({
        where: {
          business_type: createBusinessTypeDto.business_type,
        },
      });

      if (existingBusinessType) {
        throw new ConflictException({
          message: 'Business type with this name already exists',
          field: 'business_type',
          value: createBusinessTypeDto.business_type,
        });
      }

      const businessType = await this.businessTypeModel.create({ ...createBusinessTypeDto }, { transaction });
      
      await transaction.commit();
      return businessType;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, status?: BusinessTypeStatus): Promise<{ businessTypes: BusinessType[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;
    const whereClause: any = {};
    
    if (status !== undefined) {
      whereClause.status = status;
    }
    
    const { count, rows } = await this.businessTypeModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      businessTypes: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<BusinessType> {
    const businessType = await this.businessTypeModel.findByPk(id);

    if (!businessType) {
      throw new NotFoundException(`Business type with ID ${id} not found`);
    }

    return businessType;
  }

  async update(id: number, updateBusinessTypeDto: UpdateBusinessTypeDto): Promise<BusinessType> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const businessType = await this.findOne(id);
      
      // Check for duplicate name if updating business_type
      if (updateBusinessTypeDto.business_type && updateBusinessTypeDto.business_type !== businessType.business_type) {
        const existingBusinessType = await this.businessTypeModel.findOne({
          where: {
            business_type: updateBusinessTypeDto.business_type,
          },
        });

        if (existingBusinessType) {
          throw new ConflictException({
            message: 'Business type with this name already exists',
            field: 'business_type',
            value: updateBusinessTypeDto.business_type,
          });
        }
      }

      await businessType.update(updateBusinessTypeDto, { transaction });
      
      await transaction.commit();
      return businessType;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStatus(id: number, status: BusinessTypeStatus): Promise<BusinessType> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const businessType = await this.findOne(id);
      
      await businessType.update({ status }, { transaction });
      
      await transaction.commit();
      return businessType;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const businessType = await this.findOne(id);
      await businessType.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async searchBusinessTypes(query: string): Promise<BusinessType[]> {
    return this.businessTypeModel.findAll({
      where: {
        business_type: { [Op.iLike]: `%${query}%` },
      },
      order: [['business_type', 'ASC']],
    });
  }

  async getActiveBusinessTypes(): Promise<BusinessType[]> {
    return this.businessTypeModel.findAll({
      where: { status: BusinessTypeStatus.ACTIVE },
      order: [['business_type', 'ASC']],
    });
  }

  async bulkUpdateStatus(ids: number[], status: BusinessTypeStatus): Promise<number> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const [affectedCount] = await this.businessTypeModel.update(
        { status },
        {
          where: { id: ids },
          transaction,
        }
      );
      
      await transaction.commit();
      return affectedCount;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}