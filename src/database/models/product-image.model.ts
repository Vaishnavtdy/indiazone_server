import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';

@Table({
  tableName: 'product_images',
  timestamps: true,
  underscored: true,
})
export class ProductImage extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @ForeignKey(() => Product)
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  product_id: number;

  @Column({
    type: DataType.TEXT,
    validate: {
      isUrl: true,
    },
  })
  image_url: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  alt_text: string;

  @Index
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_primary: boolean;

  @Index
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sort_order: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  file_size: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  file_type: string;

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
  @BelongsTo(() => Product)
  product: Product;

  @BelongsTo(() => User, 'created_by')
  creator: User;

  @BelongsTo(() => User, 'updated_by')
  updater: User;
}