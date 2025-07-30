import { Column, Model, Table, DataType, CreatedAt, UpdatedAt, Index } from 'sequelize-typescript';

export enum UnitStatus {
  PENDING = 0,
  APPROVED = 1,
}

export enum UnitCreatedBy {
  ADMIN = 'admin',
}

@Table({
  tableName: 'units',
  timestamps: true,
  underscored: true,
})
export class Unit extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  unit_name: string;

  @Column({
    type: DataType.BIGINT,
    defaultValue: UnitStatus.PENDING,
    validate: {
      isIn: [[UnitStatus.PENDING, UnitStatus.APPROVED]],
    },
  })
  status: UnitStatus;

  @Column({
    type: DataType.ENUM(...Object.values(UnitCreatedBy)),
    allowNull: false,
  })
  created_by: UnitCreatedBy;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}