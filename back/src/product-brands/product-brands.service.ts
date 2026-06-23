import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { getProductCountsByField } from '../common/utils/product-usage-counts';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  CreateProductBrandDto,
  UpdateProductBrandDto,
} from './dto/product-brand.dto';
import { toProductBrandResponse } from './product-brands.mapper';
import {
  ProductBrand,
  ProductBrandDocument,
} from './schemas/product-brand.schema';

@Injectable()
export class ProductBrandsService {
  constructor(
    @InjectModel(ProductBrand.name)
    private readonly brandModel: Model<ProductBrandDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductBrandDto): Promise<ProductBrandDocument> {
    const name = dto.name.trim();
    const existing = await this.brandModel
      .findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
      .exec();

    if (existing) {
      throw new ConflictException('Bu nomdagi brend allaqachon mavjud');
    }

    return this.brandModel.create({
      name,
      description: dto.description?.trim() ?? '',
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const filter: {
      $or?: Array<Record<string, RegExp>>;
    } = {};

    if (pagination.search?.trim()) {
      const search = pagination.search.trim();
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }

    const [items, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.brandModel.countDocuments(filter),
    ]);

    const usageCounts = await getProductCountsByField(
      this.productModel,
      'brandId',
      items.map((item) => item._id),
    );

    return {
      data: items.map((item) =>
        toProductBrandResponse(item, usageCounts.get(item._id.toString()) ?? 0),
      ),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<ProductBrandDocument> {
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException('Brend topilmadi');
    }
    return brand;
  }

  async getProductsCount(id: string): Promise<number> {
    if (!Types.ObjectId.isValid(id)) {
      return 0;
    }

    return this.productModel
      .countDocuments({ brandId: new Types.ObjectId(id) })
      .exec();
  }

  async findByIdWithUsage(id: string) {
    const brand = await this.findById(id);
    const productsCount = await this.getProductsCount(id);
    return toProductBrandResponse(brand, productsCount);
  }

  async update(
    id: string,
    dto: UpdateProductBrandDto,
  ): Promise<ProductBrandDocument> {
    const brand = await this.findById(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException('Brend nomi bo\'sh bo\'lmasligi kerak');
      }

      const existing = await this.brandModel
        .findOne({
          _id: { $ne: id },
          name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
        })
        .exec();

      if (existing) {
        throw new ConflictException('Bu nomdagi brend allaqachon mavjud');
      }

      brand.name = name;
    }

    if (dto.description !== undefined) {
      brand.description = dto.description.trim();
    }

    if (dto.isActive !== undefined) {
      brand.isActive = dto.isActive;
    }

    await brand.save();
    return brand;
  }

  async setActive(id: string, isActive: boolean): Promise<ProductBrandDocument> {
    const brand = await this.findById(id);
    brand.isActive = isActive;
    await brand.save();
    return brand;
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findById(id);
    const productsCount = await this.getProductsCount(brand._id.toString());

    if (productsCount > 0) {
      throw new ConflictException(
        'Brend maxsulotlarda ishlatilgan, o\'chirib bo\'lmaydi',
      );
    }

    await this.brandModel.findByIdAndDelete(id).exec();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
