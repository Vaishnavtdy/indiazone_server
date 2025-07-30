import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, WhereOptions } from 'sequelize';
import { Product, ProductStatus } from '../database/models/product.model';
import { ProductImage } from '../database/models/product-image.model';
import { ProductSpecification } from '../database/models/product-specification.model';
import { User } from '../database/models/user.model';
import { ProductCategory } from '../database/models/product-category.model';
import { Unit } from '../database/models/unit.model';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product)
    private productModel: typeof Product,
    @InjectModel(ProductImage)
    private productImageModel: typeof ProductImage,
    @InjectModel(ProductSpecification)
    private productSpecificationModel: typeof ProductSpecification,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(ProductCategory)
    private productCategoryModel: typeof ProductCategory,
    @InjectModel(Unit)
    private unitModel: typeof Unit,
    private sequelize: Sequelize,
  ) {}

  private generateSlug(name: string, clientId: number): string {
    return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${clientId}`;
  }

  private async validateForeignKeys(dto: CreateProductDto | UpdateProductDto): Promise<void> {
    // Validate client exists
    if ('client_id' in dto && dto.client_id) {
      const client = await this.userModel.findByPk(dto.client_id);
      if (!client) {
        throw new BadRequestException(`Client with ID ${dto.client_id} not found`);
      }
    }

    // Validate category exists
    if (dto.category_id) {
      const category = await this.productCategoryModel.findByPk(dto.category_id);
      if (!category) {
        throw new BadRequestException(`Category with ID ${dto.category_id} not found`);
      }
    }

    // Validate unit exists
    if (dto.unit_id) {
      const unit = await this.unitModel.findByPk(dto.unit_id);
      if (!unit) {
        throw new BadRequestException(`Unit with ID ${dto.unit_id} not found`);
      }
    }
  }

  private async validateSlugUniqueness(slug: string, clientId: number, excludeId?: number): Promise<void> {
    const whereClause: WhereOptions = {
      slug,
      client_id: clientId,
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const existingProduct = await this.productModel.findOne({ where: whereClause });
    if (existingProduct) {
      throw new ConflictException({
        message: 'Product with this slug already exists for this client',
        field: 'slug',
        value: slug,
      });
    }
  }

  private async validateImageConstraints(images: any[]): Promise<void> {
    // Ensure only one primary image
    const primaryImages = images.filter(img => img.is_primary);
    if (primaryImages.length > 1) {
      throw new BadRequestException('Only one primary image is allowed');
    }

    // Validate image URLs
    for (const image of images) {
      try {
        new URL(image.image_url);
      } catch {
        throw new BadRequestException(`Invalid image URL: ${image.image_url}`);
      }
    }
  }

private async validateSpecificationConstraints(specifications: any): Promise<void> {
    if (!specifications) return;

    let parsedSpecifications: any[];
    
    // Handle both string and array inputs
    if (typeof specifications === 'string') {
      try {
        parsedSpecifications = JSON.parse(specifications);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for specifications');
      }
    } else if (Array.isArray(specifications)) {
      parsedSpecifications = specifications;
    } else {
      throw new BadRequestException('Specifications must be an array or valid JSON string');
    }

    // Check if parsed result is an array
    if (!Array.isArray(parsedSpecifications)) {
      throw new BadRequestException('Specifications must be an array');
    }

    // Return early if empty array
    if (parsedSpecifications.length === 0) return;

    // Check for duplicate key names within the same product
    const keyNames = parsedSpecifications.map(spec => spec.key_name?.toLowerCase()).filter(Boolean);
    const duplicateKeys = keyNames.filter((key, index) => keyNames.indexOf(key) !== index);
    
    if (duplicateKeys.length > 0) {
      throw new BadRequestException(`Duplicate specification keys found: ${duplicateKeys.join(', ')}`);
    }

    // Validate key names and values are not empty
    for (const spec of parsedSpecifications) {
      if (!spec.key_name?.trim()) {
        throw new BadRequestException('Specification key name cannot be empty');
      }
      if (!spec.value?.trim()) {
        throw new BadRequestException('Specification value cannot be empty');
      }
    }
  }

  // private async checkUserPermission(userId: number, clientId: number): Promise<void> {
  //   const user = await this.userModel.findByPk(userId);
  //   if (!user) {
  //     throw new ForbiddenException('User not found');
  //   }

  //   // Admin can access all products, others can only access their own client's products
  //   if (user.type !== 'admin' && user.id !== clientId) {
  //     throw new ForbiddenException('You can only access your own products');
  //   }
  // }

  async create(createProductDto: CreateProductDto, createdBy: number): Promise<Product> {
    const transaction = await this.sequelize.transaction();
console.log("createProductDto")
console.log(createProductDto)
    try {
      // Validate permissions
      // await this.checkUserPermission(createdBy, createProductDto.client_id);

      // Validate foreign keys
      // await this.validateForeignKeys(createProductDto);

      // Generate slug if not provided
      const slug = createProductDto.slug || this.generateSlug(createProductDto.name, createProductDto.client_id);

      // Validate slug uniqueness
      // await this.validateSlugUniqueness(slug, createProductDto.client_id);

      // Validate images if provided
      // if (createProductDto.images && createProductDto.images.length > 0) {
      //   await this.validateImageConstraints(createProductDto.images);
      // }

      // Validate specifications if provided
      if (createProductDto.specifications && createProductDto.specifications.length > 0) {
        await this.validateSpecificationConstraints(createProductDto.specifications);
      }

      // Create product
      const productData = {
        ...createProductDto,
        slug,
        created_by: parseInt(process.env.ADMIN_USER_ID),
        status: createProductDto.status || ProductStatus.DRAFT,
      };

      console.log(productData);

      const product = await this.productModel.create(productData, { transaction });

      // Create images if provided
      if (createProductDto.images && createProductDto.images.length > 0) {
        let hasSetPrimary = false;
        const imagePromises = createProductDto.images.map((image, index) => {
          const isPrimary = image.is_primary || (!hasSetPrimary && index === 0);
          if (isPrimary) hasSetPrimary = true;

          return this.productImageModel.create({
            ...image,
            product_id: product.id,
            is_primary: isPrimary,
            sort_order: image.sort_order || index,
            created_by: parseInt(process.env.ADMIN_USER_ID),
          }, { transaction });
        });
        await Promise.all(imagePromises);
      }

     // Create specifications if provided
if (createProductDto.specifications) {
  let parsedSpecifications: any[];
  
  // Handle both string and array inputs
  if (typeof createProductDto.specifications === 'string') {
    try {
      parsedSpecifications = JSON.parse(createProductDto.specifications);
    } catch (error) {
      throw new BadRequestException('Invalid JSON format for specifications');
    }
  } else if (Array.isArray(createProductDto.specifications)) {
    parsedSpecifications = createProductDto.specifications;
  } else {
    throw new BadRequestException('Specifications must be an array or valid JSON string');
  }

  // Check if parsed result is an array
  if (!Array.isArray(parsedSpecifications)) {
    throw new BadRequestException('Specifications must be an array');
  }

  // Create specifications if array has items
  if (parsedSpecifications.length > 0) {
    const specificationPromises = parsedSpecifications.map((spec) => {
      return this.productSpecificationModel.create({
        product_id: product.id,
        key_name: spec.key_name,
        value: spec.value,
        status: spec.status || 'pending',
        created_by: spec.created_by || createdBy,
        updated_by: spec.updated_by || createdBy,
      }, { transaction });
    });
    await Promise.all(specificationPromises);
  }
}

      await transaction.commit();
      return this.findOne(product.id, 1);
    } catch (error) {
      console.log(error)
      await transaction.rollback();
      throw error;
    }
  }



// New method to handle image updates separately
async updateProductImages(
  productId: number, 
  images: CreateProductImageDto[], 
  updatedBy: number
): Promise<void> {
  const transaction = await this.sequelize.transaction();

  try {
    // Validate that the product exists
    const product = await this.productModel.findByPk(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Validate images if provided
    if (images && images.length > 0) {
      // await this.validateImageConstraints(images);
    }

    // Delete existing images for this product (optional - based on your business logic)
    // await this.productImageModel.destroy({
    //   where: { product_id: productId },
    //   transaction
    // });

    // Create new images
    if (images && images.length > 0) {
      let hasSetPrimary = false;
      const imagePromises = images.map((image, index) => {
        const isPrimary = image.is_primary || (!hasSetPrimary && index === 0);
        if (isPrimary) hasSetPrimary = true;

        return this.productImageModel.create({
          ...image,
          product_id: productId,
          is_primary: isPrimary,
          sort_order: image.sort_order || index,
          created_by: updatedBy,
        }, { transaction });
      });
      await Promise.all(imagePromises);
    }

    await transaction.commit();
    console.log(`Successfully updated images for product ID: ${productId}`);
  } catch (error) {
    console.log('Error updating product images:', error);
    await transaction.rollback();
    throw error;
  }
}






  async findAll(query: ProductQueryDto, userId: number): Promise<{ products: Product[]; total: number; pages: number }> {
    const { page = 1, limit = 10, search, status, category_id, client_id, sort_by = 'name', sort_order = 'DESC' } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: WhereOptions = {};

    // User permission check - non-admin users can only see their own products
    const user = await this.userModel.findByPk(userId);
    if (user?.type !== 'admin') {
      whereClause.client_id = userId;
    } else if (client_id) {
      whereClause.client_id = client_id;
    }

    // Uncomment and fix search logic if needed
    // if (search) {
    //   whereClause[Op.or] = [
    //     { name: { [Op.iLike]: `%${search}%` } },
    //     { short_description: { [Op.iLike]: `%${search}%` } },
    //     { description: { [Op.iLike]: `%${search}%` } },
    //   ];
    // }

    if (status) {
      whereClause.status = status;
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    // Build include array - added specifications
    const include = [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'first_name', 'last_name', 'email'],
      },
      {
        model: ProductCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model: Unit,
        as: 'unit',
        attributes: ['id', 'unit_name'],
      },
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order'],
      },
      {
        model: ProductSpecification,
        as: 'specifications',
        attributes: ['id', 'key_name', 'value', 'status'],
      },
    ];

    // Build order array - include both main model ordering and associated model ordering
    const orderClause = [
      [sort_by, sort_order], // Main product ordering
    ];

    const { count, rows } = await this.productModel.findAndCountAll({
      where: whereClause,
      include,
      limit,
      offset,
      // order: orderClause,
      distinct: true,
    });

    return {
      products: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number, userId: number): Promise<Product> {
    const product = await this.productModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: ProductCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_name'],
        },
        {
          model: ProductImage,
          as: 'images',
          order: [['sort_order', 'ASC']],
        },
        {
          model: ProductSpecification,
          as: 'specifications',
          order: [['key_name', 'ASC']],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'first_name', 'last_name'],
            },
            {
              model: User,
              as: 'updater', 
              attributes: ['id', 'first_name', 'last_name'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check permissions
    // await this.checkUserPermission(userId, product.client_id);

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, updatedBy: number): Promise<Product> {
    const transaction = await this.sequelize.transaction();

    try {
      const product = await this.findOne(id, updatedBy);

      // Validate foreign keys if being updated
      await this.validateForeignKeys(updateProductDto);

      // Validate slug uniqueness if being updated
      if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
        await this.validateSlugUniqueness(updateProductDto.slug, product.client_id, id);
      }

      // Generate new slug if name is being updated but slug is not provided
      if (updateProductDto.name && !updateProductDto.slug && updateProductDto.name !== product.name) {
        updateProductDto.slug = this.generateSlug(updateProductDto.name, product.client_id);
        await this.validateSlugUniqueness(updateProductDto.slug, product.client_id, id);
      }

      // Validate images if provided
      if (updateProductDto.images && updateProductDto.images.length > 0) {
        await this.validateImageConstraints(updateProductDto.images);
      }

      // Validate specifications if provided
      if (updateProductDto.specifications && updateProductDto.specifications.length > 0) {
        await this.validateSpecificationConstraints(updateProductDto.specifications);
      }

      // Update product
      const updateData = {
        ...updateProductDto,
        updated_by: updatedBy,
      };

      await product.update(updateData, { transaction });

      // Handle images update if provided
      if (updateProductDto.images) {
        // Remove existing images
        await this.productImageModel.destroy({
          where: { product_id: id },
          transaction,
        });

        // Create new images
        if (updateProductDto.images.length > 0) {
          let hasSetPrimary = false;
          const imagePromises = updateProductDto.images.map((image, index) => {
            const isPrimary = image.is_primary || (!hasSetPrimary && index === 0);
            if (isPrimary) hasSetPrimary = true;

            return this.productImageModel.create({
              ...image,
              product_id: id,
              is_primary: isPrimary,
              sort_order: image.sort_order || index,
              created_by: updatedBy,
            }, { transaction });
          });
          await Promise.all(imagePromises);
        }
      }

      // Handle specifications update if provided
      if (updateProductDto.specifications) {
        // Remove existing specifications
        await this.productSpecificationModel.destroy({
          where: { product_id: id },
          transaction,
        });

        // Create new specifications
        if (updateProductDto.specifications.length > 0) {
          const specificationPromises = updateProductDto.specifications.map((spec) => {
            return this.productSpecificationModel.create({
              product_id: id,
              key_name: spec.key_name,
              value: spec.value,
              status: spec.status || 'pending',
              created_by: spec.created_by || updatedBy,
              updated_by: spec.updated_by || updatedBy,
            }, { transaction });
          });
          await Promise.all(specificationPromises);
        }
      }

      await transaction.commit();
      return this.findOne(id, updatedBy);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStatus(id: number, status: ProductStatus, updatedBy: number): Promise<Product> {
    const transaction = await this.sequelize.transaction();

    try {
      const product = await this.findOne(id, updatedBy);

      // Validate status transition
      if (status === ProductStatus.ACTIVE) {
        // Check if product has at least one image
        const images = await this.productImageModel.findAll({
          where: { product_id: id },
        });

        if (images.length === 0) {
          throw new BadRequestException('Cannot activate product without images');
        }
      }

      await product.update({ status, updated_by: updatedBy }, { transaction });

      await transaction.commit();
      return this.findOne(id, updatedBy);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number, userId: number): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const product = await this.findOne(id, userId);

      // // Check if product can be deleted (business rule: only draft products can be hard deleted)
      // if (product.status !== ProductStatus.DRAFT) {
      //   throw new BadRequestException('Only draft products can be deleted. Use status update for other products.');
      // }

      // Delete related records (cascade will handle this, but explicit for clarity)
      await this.productImageModel.destroy({
        where: { product_id: id },
        transaction,
      });

      await this.productSpecificationModel.destroy({
        where: { product_id: id },
        transaction,
      });

      await product.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async bulkUpdateStatus(ids: number[], status: ProductStatus, updatedBy: number): Promise<number> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate user has permission for all products
      const products = await this.productModel.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: ['id', 'client_id'],
      });

      // for (const product of products) {
      //   await this.checkUserPermission(updatedBy, product.client_id);
      // }

      const [affectedCount] = await this.productModel.update(
        { status, updated_by: updatedBy },
        {
          where: { id: { [Op.in]: ids } },
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

  // Image-specific operations
  async getProductImages(productId: number, userId: number): Promise<ProductImage[]> {
    const product = await this.findOne(productId, userId);

    return this.productImageModel.findAll({
      where: { product_id: productId },
      order: [['sort_order', 'ASC']],
    });
  }

  async updateImageOrder(imageId: number, sortOrder: number, updatedBy: number): Promise<ProductImage> {
    const transaction = await this.sequelize.transaction();

    try {
      const image = await this.productImageModel.findByPk(imageId, {
        include: [{ model: Product, as: 'product' }],
      });

      if (!image) {
        throw new NotFoundException(`Image with ID ${imageId} not found`);
      }

      // Check permissions
      // await this.checkUserPermission(updatedBy, image.product.client_id);

      await image.update({
        sort_order: sortOrder,
        updated_by: updatedBy,
      }, { transaction });

      await transaction.commit();
      return image;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async setPrimaryImage(imageId: number, updatedBy: number): Promise<ProductImage> {
    const transaction = await this.sequelize.transaction();

    try {
      const image = await this.productImageModel.findByPk(imageId, {
        include: [{ model: Product, as: 'product' }],
      });

      if (!image) {
        throw new NotFoundException(`Image with ID ${imageId} not found`);
      }

      // Check permissions
      // await this.checkUserPermission(updatedBy, image.product.client_id);

      // Remove primary flag from other images
      await this.productImageModel.update(
        { is_primary: false, updated_by: updatedBy },
        { where: { product_id: image.product_id }, transaction }
      );

      // Set this image as primary
      await image.update({
        is_primary: true,
        updated_by: updatedBy,
      }, { transaction });

      await transaction.commit();
      return image;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Specification-specific operations
  async getProductSpecifications(productId: number, userId: number): Promise<ProductSpecification[]> {
    const product = await this.findOne(productId, userId);

    return this.productSpecificationModel.findAll({
      where: { product_id: productId },
      order: [['key_name', 'ASC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });
  }

  async updateSpecificationStatus(specId: number, status: string, updatedBy: number): Promise<ProductSpecification> {
    const transaction = await this.sequelize.transaction();

    try {
      const specification = await this.productSpecificationModel.findByPk(specId, {
        include: [{ model: Product, as: 'product' }],
      });

      if (!specification) {
        throw new NotFoundException(`Specification with ID ${specId} not found`);
      }

      // Check permissions
      // await this.checkUserPermission(updatedBy, specification.product.client_id);

      await specification.update({
        status,
        updated_by: updatedBy,
      }, { transaction });

      await transaction.commit();
      return specification;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateSpecification(specId: number, keyName: string, value: string, updatedBy: number): Promise<ProductSpecification> {
    const transaction = await this.sequelize.transaction();

    try {
      const specification = await this.productSpecificationModel.findByPk(specId, {
        include: [{ model: Product, as: 'product' }],
      });

      if (!specification) {
        throw new NotFoundException(`Specification with ID ${specId} not found`);
      }

      // Check permissions
      // await this.checkUserPermission(updatedBy, specification.product.client_id);

      // Check for duplicate key names (excluding current specification)
      const existingSpec = await this.productSpecificationModel.findOne({
        where: {
          product_id: specification.product_id,
          key_name: keyName,
          id: { [Op.ne]: specId },
        },
      });

      if (existingSpec) {
        throw new BadRequestException(`Specification with key '${keyName}' already exists for this product`);
      }

      await specification.update({
        key_name: keyName,
        value,
        updated_by: updatedBy,
      }, { transaction });

      await transaction.commit();
      return specification;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteSpecification(specId: number, userId: number): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const specification = await this.productSpecificationModel.findByPk(specId, {
        include: [{ model: Product, as: 'product' }],
      });

      if (!specification) {
        throw new NotFoundException(`Specification with ID ${specId} not found`);
      }

      // Check permissions
      // await this.checkUserPermission(userId, specification.product.client_id);

      await specification.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async bulkUpdateSpecificationStatus(specIds: number[], status: string, updatedBy: number): Promise<number> {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate user has permission for all specifications
      const specifications = await this.productSpecificationModel.findAll({
        where: { id: { [Op.in]: specIds } },
        include: [{ model: Product, as: 'product', attributes: ['id', 'client_id'] }],
      });

      // for (const spec of specifications) {
      //   await this.checkUserPermission(updatedBy, spec.product.client_id);
      // }

      const [affectedCount] = await this.productSpecificationModel.update(
        { status, updated_by: updatedBy },
        {
          where: { id: { [Op.in]: specIds } },
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

// export { ProductsService }