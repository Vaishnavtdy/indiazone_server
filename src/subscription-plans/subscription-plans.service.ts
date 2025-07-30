import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { SubscriptionPlan, SubscriptionPlanStatus } from '../database/models/subscription-plan.model';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectModel(SubscriptionPlan)
    private subscriptionPlanModel: typeof SubscriptionPlan,
    private sequelize: Sequelize,
  ) {}

  async create(createSubscriptionPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Check if plan already exists
      const existingPlan = await this.subscriptionPlanModel.findOne({
        where: {
          name: createSubscriptionPlanDto.name,
        },
      });

      if (existingPlan) {
        throw new ConflictException({
          message: 'Subscription plan with this name already exists',
          field: 'name',
          value: createSubscriptionPlanDto.name,
        });
      }

      const plan = await this.subscriptionPlanModel.create({ ...createSubscriptionPlanDto }, { transaction });
      
      await transaction.commit();
      return plan;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, status?: SubscriptionPlanStatus): Promise<{ plans: SubscriptionPlan[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;
    const whereClause: any = {};
    
    // if (status !== undefined) {
    //   whereClause.status = status;
    // }
    
    const { count, rows } = await this.subscriptionPlanModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      plans: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanModel.findByPk(id);

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async update(id: number, updateSubscriptionPlanDto: UpdateSubscriptionPlanDto, updatedBy?: number): Promise<SubscriptionPlan> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const plan = await this.findOne(id);
      
      // Check for duplicate name if updating name
      if (updateSubscriptionPlanDto.name && updateSubscriptionPlanDto.name !== plan.name) {
        const existingPlan = await this.subscriptionPlanModel.findOne({
          where: {
            name: updateSubscriptionPlanDto.name,
          },
        });

        if (existingPlan) {
          throw new ConflictException({
            message: 'Subscription plan with this name already exists',
            field: 'name',
            value: updateSubscriptionPlanDto.name,
          });
        }
      }

      // Add audit information
      const updateData = {
        ...updateSubscriptionPlanDto,
        updated_by: updatedBy,
      };

      await plan.update(updateData, { transaction });
      
      await transaction.commit();
      return plan;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStatus(id: number, status: SubscriptionPlanStatus, updatedBy?: number): Promise<SubscriptionPlan> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const plan = await this.findOne(id);
      
      await plan.update({ status, updated_by: updatedBy }, { transaction });
      
      await transaction.commit();
      return plan;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const plan = await this.findOne(id);
      await plan.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async searchPlans(query: string): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanModel.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` },
      },
      order: [['name', 'ASC']],
    });
  }

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanModel.findAll({
      where: { status: SubscriptionPlanStatus.ACTIVE },
      order: [['price', 'ASC']],
    });
  }

  async getPlansByPriceRange(minPrice: number, maxPrice: number): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanModel.findAll({
      where: {
        price: {
          [Op.between]: [minPrice, maxPrice],
        },
        status: SubscriptionPlanStatus.ACTIVE,
      },
      order: [['price', 'ASC']],
    });
  }

  async checkPlanFeature(planId: number, feature: string): Promise<boolean> {
    const plan = await this.findOne(planId);
    
    switch (feature) {
      case 'video_access':
        return plan.video_access;
      case 'whatsapp_chat':
        return plan.whatsapp_chat;
      case 'ai_agent':
        return plan.ai_agent !== 'Not Available';
      case 'pdf_brochure':
        return plan.pdf_brochure !== 'Not Available';
      default:
        return false;
    }
  }

  async bulkUpdateStatus(ids: number[], status: SubscriptionPlanStatus, updatedBy?: number): Promise<number> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const [affectedCount] = await this.subscriptionPlanModel.update(
        { status, updated_by: updatedBy },
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