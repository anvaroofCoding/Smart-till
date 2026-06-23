import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { UserWarehouseScope } from '../common/utils/user-warehouse-scope';
import { emptyPaginatedMeta } from '../common/utils/user-warehouse-scope';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from './dto/warehouse.dto';
import { toWarehouseResponse } from './warehouses.mapper';
import {
  Warehouse,
  WarehouseDocument,
} from './schemas/warehouse.schema';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
  ) {}

  async create(dto: CreateWarehouseDto): Promise<WarehouseDocument> {
    const name = dto.name.trim();
    const existing = await this.warehouseModel
      .findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
      .exec();

    if (existing) {
      throw new ConflictException('Bu nomdagi ombor allaqachon mavjud');
    }

    return this.warehouseModel.create({
      name,
      address: dto.address?.trim() ?? '',
      description: dto.description?.trim() ?? '',
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(pagination: PaginationDto, scope?: UserWarehouseScope) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const filter: {
      $or?: Array<Record<string, RegExp>>;
      _id?: { $in: Types.ObjectId[] };
    } = {};

    if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return {
          data: [],
          meta: emptyPaginatedMeta(page, perPage),
        };
      }

      filter._id = { $in: scope.warehouseIds };
    }

    if (pagination.search?.trim()) {
      const search = pagination.search.trim();
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { address: regex },
        { description: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.warehouseModel
        .find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.warehouseModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toWarehouseResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseModel.findById(id).exec();
    if (!warehouse) {
      throw new NotFoundException('Ombor topilmadi');
    }
    return warehouse;
  }

  async findByIdResponse(id: string) {
    const warehouse = await this.findById(id);
    return toWarehouseResponse(warehouse);
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseDocument> {
    const warehouse = await this.findById(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException('Ombor nomi bo\'sh bo\'lmasligi kerak');
      }

      const existing = await this.warehouseModel
        .findOne({
          _id: { $ne: id },
          name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
        })
        .exec();

      if (existing) {
        throw new ConflictException('Bu nomdagi ombor allaqachon mavjud');
      }

      warehouse.name = name;
    }

    if (dto.address !== undefined) {
      warehouse.address = dto.address.trim();
    }

    if (dto.description !== undefined) {
      warehouse.description = dto.description.trim();
    }

    if (dto.isActive !== undefined) {
      warehouse.isActive = dto.isActive;
    }

    await warehouse.save();
    return warehouse;
  }

  async setActive(id: string, isActive: boolean): Promise<WarehouseDocument> {
    const warehouse = await this.findById(id);
    warehouse.isActive = isActive;
    await warehouse.save();
    return warehouse;
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.warehouseModel.findByIdAndDelete(id).exec();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
