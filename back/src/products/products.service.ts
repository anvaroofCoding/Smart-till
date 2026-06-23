import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  ProductBrand,
  ProductBrandDocument,
} from '../product-brands/schemas/product-brand.schema';
import {
  ProductCategory,
  ProductCategoryDocument,
} from '../product-categories/schemas/product-category.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { toProductResponse } from './products.mapper';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductCategory.name)
    private readonly categoryModel: Model<ProductCategoryDocument>,
    @InjectModel(ProductBrand.name)
    private readonly brandModel: Model<ProductBrandDocument>,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const name = dto.name.trim();
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureBrandExists(dto.brandId);
    this.validateImage(dto.image);

    const existing = await this.productModel
      .findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
      .exec();

    if (existing) {
      throw new ConflictException('Bu nomdagi maxsulot allaqachon mavjud');
    }

    const product = await this.productModel.create({
      name,
      categoryId: new Types.ObjectId(dto.categoryId),
      brandId: new Types.ObjectId(dto.brandId),
      image: dto.image?.trim() ?? '',
      isActive: dto.isActive ?? true,
    });

    return this.findById(product._id.toString());
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const filter: {
      $or?: Array<Record<string, unknown>>;
    } = {};

    if (pagination.search?.trim()) {
      const search = pagination.search.trim();
      const regex = new RegExp(search, 'i');

      const [categoryIds, brandIds] = await Promise.all([
        this.categoryModel.find({ name: regex }).distinct('_id').exec(),
        this.brandModel.find({ name: regex }).distinct('_id').exec(),
      ]);

      filter.$or = [
        { name: regex },
        { categoryId: { $in: categoryIds } },
        { brandId: { $in: brandIds } },
      ];
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toProductResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .exec();

    if (!product) {
      throw new NotFoundException('Maxsulot topilmadi');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Maxsulot topilmadi');
    }

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
      product.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.brandId !== undefined) {
      await this.ensureBrandExists(dto.brandId);
      product.brandId = new Types.ObjectId(dto.brandId);
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new ConflictException('Maxsulot nomi bo\'sh bo\'lmasligi kerak');
      }

      const existing = await this.productModel
        .findOne({
          _id: { $ne: id },
          name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
        })
        .exec();

      if (existing) {
        throw new ConflictException('Bu nomdagi maxsulot allaqachon mavjud');
      }

      product.name = name;
    }

    if (dto.image !== undefined) {
      this.validateImage(dto.image);
      product.image = dto.image.trim();
    }

    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }

    await product.save();
    return this.findById(id);
  }

  async setActive(id: string, isActive: boolean): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Maxsulot topilmadi');
    }

    product.isActive = isActive;
    await product.save();
    return this.findById(id);
  }

  private async ensureCategoryExists(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Kategoriya tanlanmagan');
    }

    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new BadRequestException('Tanlangan kategoriya topilmadi');
    }
  }

  private async ensureBrandExists(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Brend tanlanmagan');
    }

    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new BadRequestException('Tanlangan brend topilmadi');
    }
  }

  private validateImage(image?: string) {
    if (!image?.trim()) return;

    if (!image.startsWith('data:image/')) {
      throw new BadRequestException('Rasm noto\'g\'ri formatda');
    }
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
