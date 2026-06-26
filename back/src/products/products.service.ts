import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import {
  ProductBrand,
  ProductBrandDocument,
} from '../product-brands/schemas/product-brand.schema';
import {
  ProductCategory,
  ProductCategoryDocument,
} from '../product-categories/schemas/product-category.schema';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from './dto/product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductBarcodesService } from './product-barcodes.service';
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
    private readonly productBarcodesService: ProductBarcodesService,
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
      code: await this.generateProductCode(),
      description: dto.description?.trim() ?? '',
      categoryId: new Types.ObjectId(dto.categoryId),
      brandId: new Types.ObjectId(dto.brandId),
      image: dto.image?.trim() ?? '',
      isActive: dto.isActive ?? true,
    });

    await this.productBarcodesService.ensurePrimaryBarcode(
      product._id.toString(),
    );

    return this.findById(product._id.toString());
  }

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const filter = await this.buildListFilter(query);

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

    const productIds = items.map((item) => item._id.toString());
    const barcodesMap =
      await this.productBarcodesService.getBarcodesMap(productIds);

    return {
      data: items.map((item) =>
        toProductResponse(item, barcodesMap.get(item._id.toString()) ?? []),
      ),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  private async buildListFilter(
    query: ProductQueryDto,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [];

    if (query.id?.trim()) {
      const idSearch = escapeRegex(query.id.trim());
      if (Types.ObjectId.isValid(query.id.trim())) {
        and.push({ _id: new Types.ObjectId(query.id.trim()) });
      } else {
        and.push({
          $expr: {
            $regexMatch: {
              input: { $toString: '$_id' },
              regex: idSearch,
              options: 'i',
            },
          },
        });
      }
    }

    if (query.code?.trim()) {
      and.push({ code: new RegExp(escapeRegex(query.code.trim()), 'i') });
    }

    if (query.name?.trim()) {
      and.push({ name: new RegExp(escapeRegex(query.name.trim()), 'i') });
    }

    if (query.description?.trim()) {
      and.push({
        description: new RegExp(escapeRegex(query.description.trim()), 'i'),
      });
    }

    if (query.brandId) {
      and.push({ brandId: new Types.ObjectId(query.brandId) });
    }

    if (query.categoryId) {
      and.push({ categoryId: new Types.ObjectId(query.categoryId) });
    }

    if (query.isActive !== undefined) {
      and.push({ isActive: query.isActive });
    }

    const createdAtRange = parseCreatedAtFilter(query.createdAt);
    if (createdAtRange) {
      and.push({ createdAt: createdAtRange });
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      const regex = new RegExp(escapeRegex(search), 'i');

      const [categoryIds, brandIds, barcodeProductIds] = await Promise.all([
        this.categoryModel.find({ name: regex }).distinct('_id').exec(),
        this.brandModel.find({ name: regex }).distinct('_id').exec(),
        this.productBarcodesService.findProductIdsByBarcodeSearch(search),
      ]);

      and.push({
        $or: [
          { name: regex },
          { code: regex },
          { barcode: regex },
          { description: regex },
          { categoryId: { $in: categoryIds } },
          { brandId: { $in: brandIds } },
          { _id: { $in: barcodeProductIds } },
        ],
      });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }

  async mapToResponse(product: ProductDocument): Promise<ProductResponseDto> {
    const productId = product._id.toString();
    const barcodesMap =
      await this.productBarcodesService.getBarcodesMap([productId]);

    return toProductResponse(product, barcodesMap.get(productId) ?? []);
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

    if (dto.description !== undefined) {
      product.description = dto.description.trim();
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

  async ensureBarcode(productId: string): Promise<string> {
    return this.productBarcodesService.ensurePrimaryBarcode(productId);
  }

  async ensureBarcodes(productIds: string[]): Promise<Map<string, string>> {
    return this.productBarcodesService.ensureBarcodes(productIds);
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

  private async generateProductCode(): Promise<string> {
    const prefix = 'MXS-';
    const padLength = 6;

    for (let attempt = 0; attempt < 5; attempt++) {
      const last = await this.productModel
        .findOne({ code: { $regex: `^${prefix}\\d+$` } })
        .sort({ code: -1 })
        .collation({ locale: 'en', numericOrdering: true })
        .select('code')
        .lean()
        .exec();

      let next = 1;
      if (last?.code) {
        const parsed = Number.parseInt(last.code.slice(prefix.length), 10);
        if (!Number.isNaN(parsed)) {
          next = parsed + 1 + attempt;
        }
      } else {
        next = 1 + attempt;
      }

      const code = `${prefix}${String(next).padStart(padLength, '0')}`;
      const exists = await this.productModel.exists({ code }).exec();
      if (!exists) {
        return code;
      }
    }

    throw new ConflictException('Maxsulot kodi yaratib bo\'lmadi');
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCreatedAtFilter(
  value?: string,
): { $gte: Date; $lt: Date } | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  let year: number;
  let month: number;
  let day: number;

  const dotted = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  const dashed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (dotted) {
    day = Number(dotted[1]);
    month = Number(dotted[2]);
    year = Number(dotted[3]);
  } else if (dashed) {
    year = Number(dashed[1]);
    month = Number(dashed[2]);
    day = Number(dashed[3]);
  } else {
    return null;
  }

  const start = new Date(year, month - 1, day);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(year, month - 1, day + 1);
  return { $gte: start, $lt: end };
}
