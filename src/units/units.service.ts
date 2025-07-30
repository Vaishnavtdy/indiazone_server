import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize-typescript";
import { Op } from "sequelize";
import { Unit, UnitStatus } from "../database/models/unit.model";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class UnitsService {
  constructor(
    @InjectModel(Unit)
    private unitModel: typeof Unit,
    private sequelize: Sequelize
  ) {}

  async create(createUnitDto: CreateUnitDto): Promise<Unit> {
    const transaction = await this.sequelize.transaction();

    try {
      // Check if unit already exists
      const existingUnit = await this.unitModel.findOne({
        where: {
          unit_name: createUnitDto.unit_name,
        },
      });

      if (existingUnit) {
        throw new ConflictException({
          message: "Unit with this name already exists",
          field: "unit_name",
          value: createUnitDto.unit_name,
        });
      }

      const unit = await this.unitModel.create({ ...createUnitDto }, { transaction });

      await transaction.commit();
      return unit;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // async findAll(
  //   page: number = 1,
  //   limit: number = 10,
  //   status?: UnitStatus
  // ): Promise<{ units: Unit[]; total: number; pages: number }> {
  //   const offset = (page - 1) * limit;
  //   console.log("status ===>", status);

  //   const whereClause = status != undefined && status != null ? { status } : {};

  //   const { count, rows } = await this.unitModel.findAndCountAll({
  //     where: whereClause,
  //     limit,
  //     offset,
  //     order: [["created_at", "DESC"]],
  //   });

  //   return {
  //     units: rows,
  //     total: count,
  //     pages: Math.ceil(count / limit),
  //   };
  // }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string | UnitStatus | null
  ): Promise<{ units: Unit[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    console.log("status ===>", status);

    // Normalize status
    if (status !== undefined && status !== null && status !== "null" && status !== "undefined" && status !== "") {
      const parsedStatus = Number(status);
      if (!isNaN(parsedStatus)) {
        whereClause.status = parsedStatus;
      }
    }

    const { count, rows } = await this.unitModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return {
      units: rows,
      total: count,
      pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number): Promise<Unit> {
    const unit = await this.unitModel.findByPk(id);

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    return unit;
  }

  async update(id: number, updateUnitDto: UpdateUnitDto): Promise<Unit> {
    const transaction = await this.sequelize.transaction();

    try {
      const unit = await this.findOne(id);

      // Check for duplicate name if updating unit_name
      if (updateUnitDto.unit_name && updateUnitDto.unit_name !== unit.unit_name) {
        const existingUnit = await this.unitModel.findOne({
          where: {
            unit_name: updateUnitDto.unit_name,
          },
        });

        if (existingUnit) {
          throw new ConflictException({
            message: "Unit with this name already exists",
            field: "unit_name",
            value: updateUnitDto.unit_name,
          });
        }
      }

      await unit.update(updateUnitDto, { transaction });

      await transaction.commit();
      return unit;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStatus(id: number, status: UnitStatus): Promise<Unit> {
    const transaction = await this.sequelize.transaction();

    try {
      const unit = await this.findOne(id);

      await unit.update({ status }, { transaction });

      await transaction.commit();
      return unit;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.sequelize.transaction();

    try {
      const unit = await this.findOne(id);
      await unit.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async searchUnits(query: string): Promise<Unit[]> {
    return this.unitModel.findAll({
      where: {
        unit_name: { [Op.iLike]: `%${query}%` },
      },
      order: [["unit_name", "ASC"]],
    });
  }

  async getApprovedUnits(): Promise<Unit[]> {
    return this.unitModel.findAll({
      where: { status: UnitStatus.APPROVED },
      order: [["unit_name", "ASC"]],
    });
  }

  async bulkUpdateStatus(ids: number[], status: UnitStatus): Promise<number> {
    const transaction = await this.sequelize.transaction();

    try {
      const [affectedCount] = await this.unitModel.update(
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
