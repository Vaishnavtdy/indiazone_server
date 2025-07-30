import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';

@Table({
  tableName: 'product_specifications',
  timestamps: true,
  underscored: true,
})
export class ProductSpecification extends Model {
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
    type: DataType.STRING(255),
    allowNull: true,
  })
  value: string;

   @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  key_name: string;

    @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  status: string;

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