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
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';
import { toProductCategoryResponse } from './product-categories.mapper';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly categoryModel: Model<ProductCategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductCategoryDto): Promise<ProductCategoryDocument> {
    const name = dto.name.trim();
    const existing = await this.categoryModel
      .findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
      .exec();

    if (existing) {
      throw new ConflictException('Bu nomdagi kategoriya allaqachon mavjud');
    }

    return this.categoryModel.create({
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
      this.categoryModel
        .find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    const usageCounts = await getProductCountsByField(
      this.productModel,
      'categoryId',
      items.map((item) => item._id),
    );

    return {
      data: items.map((item) =>
        toProductCategoryResponse(
          item,
          usageCounts.get(item._id.toString()) ?? 0,
        ),
      ),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<ProductCategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
    return category;
  }

  async getProductsCount(id: string): Promise<number> {
    if (!Types.ObjectId.isValid(id)) {
      return 0;
    }

    return this.productModel
      .countDocuments({ categoryId: new Types.ObjectId(id) })
      .exec();
  }

  async findByIdWithUsage(id: string) {
    const category = await this.findById(id);
    const productsCount = await this.getProductsCount(id);
    return toProductCategoryResponse(category, productsCount);
  }

  async update(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryDocument> {
    const category = await this.findById(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException('Kategoriya nomi bo\'sh bo\'lmasligi kerak');
      }

      const existing = await this.categoryModel
        .findOne({
          _id: { $ne: id },
          name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
        })
        .exec();

      if (existing) {
        throw new ConflictException('Bu nomdagi kategoriya allaqachon mavjud');
      }

      category.name = name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description.trim();
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    await category.save();
    return category;
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<ProductCategoryDocument> {
    const category = await this.findById(id);
    category.isActive = isActive;
    await category.save();
    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    const productsCount = await this.getProductsCount(category._id.toString());

    if (productsCount > 0) {
      throw new ConflictException(
        'Kategoriya maxsulotlarda ishlatilgan, o\'chirib bo\'lmaydi',
      );
    }

    await this.categoryModel.findByIdAndDelete(id).exec();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
