import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_SUPPLIER_CURRENCY } from '../common/constants/currency';
import { DEFAULT_PER_PAGE, PaginationDto } from '../common/dto/pagination.dto';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { toSupplierResponse } from './suppliers.mapper';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async create(dto: CreateSupplierDto): Promise<SupplierDocument> {
    const name = dto.name.trim();
    await this.ensureUniqueName(name);

    const supplier = await this.supplierModel.create({
      name,
      officialName: dto.officialName?.trim() ?? '',
      phone: dto.phone?.trim() ?? '',
      address: dto.address?.trim() ?? '',
      comment: dto.comment?.trim() ?? '',
      currency: dto.currency ?? DEFAULT_SUPPLIER_CURRENCY,
      isActive: dto.isActive ?? true,
    });

    return this.findById(supplier._id.toString());
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const filter: { $or?: Array<Record<string, unknown>> } = {};

    if (pagination.search?.trim()) {
      const regex = new RegExp(escapeRegex(pagination.search.trim()), 'i');
      filter.$or = [
        { name: regex },
        { officialName: regex },
        { phone: regex },
        { address: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.supplierModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toSupplierResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException('Yetkazib beruvchi topilmadi');
    }
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException('Yetkazib beruvchi topilmadi');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException(
          'Yetkazib beruvchi nomi bo\'sh bo\'lmasligi kerak',
        );
      }
      await this.ensureUniqueName(name, id);
      supplier.name = name;
    }

    if (dto.officialName !== undefined) {
      supplier.officialName = dto.officialName.trim();
    }

    if (dto.phone !== undefined) {
      supplier.phone = dto.phone.trim();
    }

    if (dto.address !== undefined) {
      supplier.address = dto.address.trim();
    }

    if (dto.comment !== undefined) {
      supplier.comment = dto.comment.trim();
    }

    if (dto.currency !== undefined) {
      supplier.currency = dto.currency;
    }

    if (dto.isActive !== undefined) {
      supplier.isActive = dto.isActive;
    }

    await supplier.save();
    return this.findById(id);
  }

  async setActive(id: string, isActive: boolean): Promise<SupplierDocument> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException('Yetkazib beruvchi topilmadi');
    }

    supplier.isActive = isActive;
    await supplier.save();
    return this.findById(id);
  }

  private async ensureUniqueName(name: string, excludeId?: string) {
    const existing = await this.supplierModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        'Bu nomdagi yetkazib beruvchi allaqachon mavjud',
      );
    }
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
