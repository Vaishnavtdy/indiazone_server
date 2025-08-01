import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { ProductCategory, ProductCategoryStatus } from '../database/models/product-category.model';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { S3UploadService } from '../common/services/s3-upload.service';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory)
    private productCategoryModel: typeof ProductCategory,
    private sequelize: Sequelize,
    private s3UploadService: S3UploadService,
  ) {}

  async create(createProductCategoryDto: CreateProductCategoryDto, imageFile?: Express.Multer.File): Promise<ProductCategory> {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Check if category already exists
      const existingCategory = await this.productCategoryModel.findOne({
        where: {
          slug: createProductCategoryDto.slug,
        },
      });

      if (existingCategory) {
        throw new ConflictException({
          message: 'Product category with this slug already exists',
          field: 'slug',
          value: createProductCategoryDto.slug,
        });
      }

      // Validate parent exists if parent_id is provided
      if (createProductCategoryDto.parent_id) {
        const parent = await this.productCategoryModel.findByPk(createProductCategoryDto.parent_id);
        if (!parent) {
          throw new BadRequestException('Parent category not found');
        }
      }

      // Handle image upload if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        try {
          imageUrl = await this.s3UploadService.uploadFile(
            imageFile,
            `uploads/product-categories/temp-${Date.now()}/images/${Date.now()}-${imageFile.originalname}`,
            { makePublic: true }
          );
        } catch (error) {
          throw new BadRequestException(`Failed to upload category image: ${error.message}`);
        }
      }

      const categoryData = {
        ...createProductCategoryDto,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const category = await this.productCategoryModel.create(categoryData, { transaction });
      
      await transaction.commit();
      return this.findOne(category.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, status?: ProductCategoryStatus, parentId?: number): Promise<{ categories: ProductCategory[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;
    const whereClause: any = {};
    
    // if (status !== undefined) {
    //   whereClause.status = status;
    // }
    
    if (parentId !== undefined) {
      whereClause.parent_id = parentId;
    }
    
    const { count, rows } = await this.productCategoryModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProductCategory,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: ProductCategory,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      categories: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<ProductCategory> {
    const category = await this.productCategoryModel.findByPk(id, {
      include: [
        {
          model: ProductCategory,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: ProductCategory,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!category) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateProductCategoryDto: UpdateProductCategoryDto, imageFile?: Express.Multer.File): Promise<ProductCategory> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const category = await this.findOne(id);
      
      // Check for duplicate slug if updating slug
      if (updateProductCategoryDto.slug && updateProductCategoryDto.slug !== category.slug) {
        const existingCategory = await this.productCategoryModel.findOne({
          where: {
            slug: updateProductCategoryDto.slug,
          },
        });

        if (existingCategory) {
          throw new ConflictException({
            message: 'Product category with this slug already exists',
            field: 'slug',
            value: updateProductCategoryDto.slug,
          });
        }
      }

      // Validate parent exists if parent_id is being updated
      if (updateProductCategoryDto.parent_id) {
        const parent = await this.productCategoryModel.findByPk(updateProductCategoryDto.parent_id);
        if (!parent) {
          throw new BadRequestException('Parent category not found');
        }
        
        // Prevent circular reference
        if (updateProductCategoryDto.parent_id === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }
      }

      // Handle image upload if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        try {
          // Delete old image if exists
          if (category.image_url) {
            const oldImageKey = this.s3UploadService.extractKeyFromUrl(category.image_url);
            await this.s3UploadService.deleteFile(oldImageKey);
          }

          // Upload new image
          imageUrl = await this.s3UploadService.uploadFile(
            imageFile,
            `uploads/product-categories/${id}/images/${Date.now()}-${imageFile.originalname}`,
            { makePublic: true }
          );
        } catch (error) {
          throw new BadRequestException(`Failed to upload category image: ${error.message}`);
        }
      }

      const updateData = {
        ...updateProductCategoryDto,
        ...(imageUrl && { image_url: imageUrl }),
      };

      await category.update(updateData, { transaction });
      
      await transaction.commit();
      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStatus(id: number, status: ProductCategoryStatus): Promise<ProductCategory> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const category = await this.findOne(id);
      
      await category.update({ status }, { transaction });
      
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
      const category = await this.findOne(id);
      
      // Delete associated image from S3 if exists
      if (category.image_url) {
        try {
          const imageKey = this.s3UploadService.extractKeyFromUrl(category.image_url);
          await this.s3UploadService.deleteFile(imageKey);
        } catch (error) {
          console.error(`Failed to delete category image from S3: ${error.message}`);
          // Continue with category deletion even if image deletion fails
        }
      }

      // Check if category has children
      const childrenCount = await this.productCategoryModel.count({
        where: { parent_id: id },
      });

      if (childrenCount > 0) {
        throw new BadRequestException('Cannot delete category with child categories');
      }

      await category.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async searchCategories(query: string): Promise<ProductCategory[]> {
    return this.productCategoryModel.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { slug: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: ProductCategory,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async getApprovedCategories(): Promise<ProductCategory[]> {
    return this.productCategoryModel.findAll({
      where: { status: ProductCategoryStatus.APPROVED },
      include: [
        {
          model: ProductCategory,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async getRootCategories(): Promise<ProductCategory[]> {
    return this.productCategoryModel.findAll({
      where: { parent_id: null },
      include: [
        {
          model: ProductCategory,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async getCategoryTree(): Promise<ProductCategory[]> {
    const rootCategories = await this.productCategoryModel.findAll({
      where: { parent_id: null },
      include: [
        {
          model: ProductCategory,
          as: 'children',
          include: [
            {
              model: ProductCategory,
              as: 'children',
              include: [
                {
                  model: ProductCategory,
                  as: 'children',
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: ProductCategory, as: 'children' }, 'name', 'ASC'],
      ],
    });

    return rootCategories;
  }

  async getChildren(parentId: number): Promise<ProductCategory[]> {
    return this.productCategoryModel.findAll({
      where: { parent_id: parentId },
      order: [['name', 'ASC']],
    });
  }

  async getParents(categoryId: number): Promise<ProductCategory[]> {
    const parents: ProductCategory[] = [];
    let currentCategory = await this.findOne(categoryId);

    while (currentCategory.parent_id) {
      const parent = await this.findOne(currentCategory.parent_id);
      parents.unshift(parent);
      currentCategory = parent;
    }

    return parents;
  }

  async bulkUpdateStatus(ids: number[], status: ProductCategoryStatus): Promise<number> {
    const transaction = await this.sequelize.transaction();
    
    try {
      const [affectedCount] = await this.productCategoryModel.update(
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