import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';

export enum ProductCategoryStatus {
  PENDING = 0,
  APPROVED = 1,
}

export enum ProductCategoryCreatedBy {
  ADMIN = 'admin',
  VENDOR = 'vendor',
}

@Table({
  tableName: 'product_categories',
  timestamps: true,
  underscored: true,
})
export class ProductCategory extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parent_id: number;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Index
  @Column({
    type: DataType.STRING(255),
    unique: true,
    allowNull: false,
  })
  slug: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  units: string;

  @Column({
    type: DataType.BIGINT,
    defaultValue: ProductCategoryStatus.PENDING,
    validate: {
      isIn: [[ProductCategoryStatus.PENDING, ProductCategoryStatus.APPROVED]],
    },
  })
  status: ProductCategoryStatus;

  @Column({
    type: DataType.ENUM(...Object.values(ProductCategoryCreatedBy)),
    allowNull: false,
  })
  created_by: ProductCategoryCreatedBy;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Self-referencing associations
  @BelongsTo(() => ProductCategory, 'parent_id')
  parent: ProductCategory;

  @HasMany(() => ProductCategory, 'parent_id')
  children: ProductCategory[];
}