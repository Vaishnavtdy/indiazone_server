import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './user.model';
import { ProductCategory } from './product-category.model';
import { Unit } from './unit.model';
import { ProductImage } from './product-image.model';
import { ProductSpecification } from './product-specification.model';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

@Table({
  tableName: 'products',
  timestamps: true,
  underscored: true,
})
export class Product extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  client_id: number;

  @Index
  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  category_id: number;

  @Index
  @ForeignKey(() => Unit)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  unit_id: number;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  slug: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  short_description: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  description: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(ProductStatus)),
    defaultValue: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  created_by: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  updated_by: number;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Associations
  @BelongsTo(() => User, 'client_id')
  client: User;

  @BelongsTo(() => ProductCategory)
  category: ProductCategory;

  @BelongsTo(() => Unit)
  unit: Unit;

  @BelongsTo(() => User, 'created_by')
  creator: User;

  @BelongsTo(() => User, 'updated_by')
  updater: User;

  @HasMany(() => ProductSpecification)
  specifications: ProductSpecification[];

  @HasMany(() => ProductImage)
  images: ProductImage[];

  get primary_image(): ProductImage | null {
    if (!this.images) return null;
    return this.images.find(img => img.is_primary) || this.images[0] || null;
  }
}