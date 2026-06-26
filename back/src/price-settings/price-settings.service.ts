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
  buildIdFilter,
  escapeRegex,
  parseCreatedAtFilter,
} from '../common/utils/list-filter.utils';
import {
  PriceSettingMode,
  PriceSettingType,
} from './constants/price-setting-type';
import {
  CreatePriceSettingDto,
  UpdatePriceSettingDto,
} from './dto/price-setting.dto';
import { PriceSettingQueryDto } from './dto/price-setting-query.dto';
import {
  toPriceSettingLike,
  toPriceSettingResponse,
} from './price-settings.mapper';
import {
  PriceSetting,
  PriceSettingDocument,
} from './schemas/price-setting.schema';
import {
  buildSellingPriceKey,
  resolveSellingPrice,
  type ResolvedSellingPrice,
  type SellingPriceContext,
} from './utils/resolve-selling-price';

function toValidObjectIds(ids: string[]): Types.ObjectId[] {
  return [...new Set(ids)]
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
}

@Injectable()
export class PriceSettingsService {
  constructor(
    @InjectModel(PriceSetting.name)
    private readonly priceSettingModel: Model<PriceSettingDocument>,
  ) {}

  async create(dto: CreatePriceSettingDto): Promise<PriceSettingDocument> {
    this.validateDto(dto);

    const payload = this.buildPayload(dto);
    await this.ensureUnique(payload);

    const setting = await this.priceSettingModel.create(payload);
    return this.findById(setting._id.toString());
  }

  async findAll(query: PriceSettingQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const filter = this.buildListFilter(query);

    const [items, total] = await Promise.all([
      this.priceSettingModel
        .find(filter)
        .populate('warehouseId', 'name')
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.priceSettingModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toPriceSettingResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<PriceSettingDocument> {
    const setting = await this.priceSettingModel
      .findById(id)
      .populate('warehouseId', 'name')
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .populate('productId', 'name')
      .exec();

    if (!setting) {
      throw new NotFoundException('Narx sozlamasi topilmadi');
    }

    return setting;
  }

  async update(
    id: string,
    dto: UpdatePriceSettingDto,
  ): Promise<PriceSettingDocument> {
    const setting = await this.findById(id);
    const merged = this.mergeDto(setting, dto);
    this.validateDto(merged);

    const payload = this.buildPayload(merged);
    await this.ensureUnique(payload, id);

    setting.settingType = payload.settingType;
    setting.warehouseId = payload.warehouseId;
    setting.categoryId = payload.categoryId;
    setting.brandId = payload.brandId;
    setting.productId = payload.productId;
    setting.mode = payload.mode;
    setting.percentage = payload.percentage;
    setting.fixedPrice = payload.fixedPrice;

    if (dto.isActive !== undefined) {
      setting.isActive = dto.isActive;
    }

    await setting.save();
    return this.findById(id);
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<PriceSettingDocument> {
    const setting = await this.findById(id);
    setting.isActive = isActive;
    await setting.save();
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.priceSettingModel.findByIdAndDelete(id).exec();
  }

  async resolveSellingPricesForContexts(
    contexts: SellingPriceContext[],
  ): Promise<Map<string, ResolvedSellingPrice>> {
    const result = new Map<string, ResolvedSellingPrice>();

    if (contexts.length === 0) {
      return result;
    }

    const warehouseIds = [
      ...new Set(contexts.map((context) => context.warehouseId)),
    ];
    const productIds = [
      ...new Set(contexts.map((context) => context.productId)),
    ];
    const categoryIds = [
      ...new Set(contexts.map((context) => context.categoryId)),
    ];
    const brandIds = [...new Set(contexts.map((context) => context.brandId))];

    const warehouseObjectIds = toValidObjectIds(warehouseIds);
    const productObjectIds = toValidObjectIds(productIds);
    const categoryObjectIds = toValidObjectIds(categoryIds);
    const brandObjectIds = toValidObjectIds(brandIds);

    const warehouseFilter =
      warehouseObjectIds.length > 0
        ? {
            $or: [
              { warehouseId: { $in: warehouseObjectIds } },
              { warehouseId: null },
            ],
          }
        : { warehouseId: null };

    const settingTypeFilters: Array<Record<string, unknown>> = [];

    if (productObjectIds.length > 0) {
      settingTypeFilters.push({
        settingType: PriceSettingType.PRODUCT,
        productId: { $in: productObjectIds },
      });
    }

    if (categoryObjectIds.length > 0 && brandObjectIds.length > 0) {
      settingTypeFilters.push({
        settingType: PriceSettingType.BRAND,
        categoryId: { $in: categoryObjectIds },
        brandId: { $in: brandObjectIds },
      });
    }

    if (categoryObjectIds.length > 0) {
      settingTypeFilters.push({
        settingType: PriceSettingType.CATEGORY,
        categoryId: { $in: categoryObjectIds },
      });
    }

    if (settingTypeFilters.length === 0) {
      for (const context of contexts) {
        result.set(
          buildSellingPriceKey(context.warehouseId, context.productId),
          resolveSellingPrice(context, []),
        );
      }
      return result;
    }

    const settings = await this.priceSettingModel
      .find({
        isActive: true,
        $and: [warehouseFilter, { $or: settingTypeFilters }],
      })
      .exec();

    const allSettings = settings.map((setting) => toPriceSettingLike(setting));

    for (const context of contexts) {
      const applicable = allSettings.filter(
        (setting) =>
          !setting.warehouseId || setting.warehouseId === context.warehouseId,
      );
      const resolved = resolveSellingPrice(context, applicable);
      result.set(
        buildSellingPriceKey(context.warehouseId, context.productId),
        resolved,
      );
    }

    return result;
  }

  private mergeDto(
    setting: PriceSettingDocument,
    dto: UpdatePriceSettingDto,
  ): CreatePriceSettingDto {
    const applyToAllWarehouses =
      dto.applyToAllWarehouses ??
      (!setting.warehouseId && dto.warehouseId === undefined);

    return {
      settingType: dto.settingType ?? setting.settingType,
      warehouseId:
        dto.warehouseId ??
        (setting.warehouseId ? setting.warehouseId.toString() : undefined),
      applyToAllWarehouses,
      categoryId:
        dto.categoryId ??
        (setting.categoryId ? setting.categoryId.toString() : undefined),
      brandId:
        dto.brandId ?? (setting.brandId ? setting.brandId.toString() : undefined),
      productId:
        dto.productId ??
        (setting.productId ? setting.productId.toString() : undefined),
      mode: dto.mode ?? setting.mode,
      percentage: dto.percentage ?? setting.percentage,
      fixedPrice: dto.fixedPrice ?? setting.fixedPrice,
      isActive: dto.isActive ?? setting.isActive,
    };
  }

  private validateDto(dto: CreatePriceSettingDto) {
    if (!dto.applyToAllWarehouses && !dto.warehouseId) {
      throw new BadRequestException('Filialni tanlang');
    }

    if (dto.settingType === PriceSettingType.CATEGORY) {
      if (!dto.categoryId) {
        throw new BadRequestException('Kategoriyani tanlang');
      }
      if (dto.mode !== PriceSettingMode.PERCENTAGE) {
        throw new BadRequestException(
          'Kategoriya uchun faqat foiz rejimi qo\'llaniladi',
        );
      }
      if (dto.percentage === undefined) {
        throw new BadRequestException('Foizni kiriting');
      }
      return;
    }

    if (dto.settingType === PriceSettingType.BRAND) {
      if (!dto.categoryId || !dto.brandId) {
        throw new BadRequestException('Kategoriya va brendni tanlang');
      }
      if (dto.mode !== PriceSettingMode.PERCENTAGE) {
        throw new BadRequestException(
          'Brend uchun faqat foiz rejimi qo\'llaniladi',
        );
      }
      if (dto.percentage === undefined) {
        throw new BadRequestException('Foizni kiriting');
      }
      return;
    }

    if (dto.settingType === PriceSettingType.PRODUCT) {
      if (!dto.productId) {
        throw new BadRequestException('Maxsulotni tanlang');
      }

      if (dto.mode === PriceSettingMode.FIXED) {
        if (dto.fixedPrice === undefined) {
          throw new BadRequestException('Sotuv narxini kiriting');
        }
        return;
      }

      if (dto.mode === PriceSettingMode.PERCENTAGE) {
        if (dto.percentage === undefined) {
          throw new BadRequestException('Foizni kiriting');
        }
        return;
      }
    }

    throw new BadRequestException('Noto\'g\'ri sozlama turi');
  }

  private buildPayload(dto: CreatePriceSettingDto) {
    const payload: Partial<PriceSetting> & {
      warehouseId: Types.ObjectId | null;
      settingType: PriceSettingType;
      mode: PriceSettingMode;
    } = {
      settingType: dto.settingType,
      warehouseId: dto.applyToAllWarehouses
        ? null
        : new Types.ObjectId(dto.warehouseId!),
      mode: dto.mode,
      isActive: dto.isActive ?? true,
      categoryId: undefined,
      brandId: undefined,
      productId: undefined,
      percentage: undefined,
      fixedPrice: undefined,
    };

    if (dto.settingType === PriceSettingType.CATEGORY) {
      payload.categoryId = new Types.ObjectId(dto.categoryId!);
      payload.percentage = dto.percentage;
    } else if (dto.settingType === PriceSettingType.BRAND) {
      payload.categoryId = new Types.ObjectId(dto.categoryId!);
      payload.brandId = new Types.ObjectId(dto.brandId!);
      payload.percentage = dto.percentage;
    } else {
      payload.productId = new Types.ObjectId(dto.productId!);
      if (dto.mode === PriceSettingMode.FIXED) {
        payload.fixedPrice = dto.fixedPrice;
      } else {
        payload.percentage = dto.percentage;
      }
    }

    return payload;
  }

  private async ensureUnique(
    payload: ReturnType<PriceSettingsService['buildPayload']>,
    excludeId?: string,
  ) {
    const filter: Record<string, unknown> = {
      settingType: payload.settingType,
      warehouseId: payload.warehouseId ?? null,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    };

    if (payload.settingType === PriceSettingType.CATEGORY) {
      filter.categoryId = payload.categoryId;
    } else if (payload.settingType === PriceSettingType.BRAND) {
      filter.categoryId = payload.categoryId;
      filter.brandId = payload.brandId;
    } else {
      filter.productId = payload.productId;
    }

    const existing = await this.priceSettingModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException(
        'Bu kombinatsiya uchun narx sozlamasi allaqachon mavjud',
      );
    }
  }

  private buildListFilter(
    query: PriceSettingQueryDto,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [];

    const idFilter = buildIdFilter(query.id);
    if (idFilter) and.push(idFilter);

    if (query.settingType) {
      and.push({ settingType: query.settingType });
    }

    if (query.warehouseId) {
      and.push({ warehouseId: new Types.ObjectId(query.warehouseId) });
    } else if (query.allWarehouses) {
      and.push({ warehouseId: null });
    }

    if (query.categoryId) {
      and.push({ categoryId: new Types.ObjectId(query.categoryId) });
    }

    if (query.brandId) {
      and.push({ brandId: new Types.ObjectId(query.brandId) });
    }

    if (query.productId) {
      and.push({ productId: new Types.ObjectId(query.productId) });
    }

    if (query.mode) {
      and.push({ mode: query.mode });
    }

    if (query.percentage !== undefined && !Number.isNaN(query.percentage)) {
      and.push({
        percentage: {
          $gte: query.percentage - 0.01,
          $lte: query.percentage + 0.01,
        },
      });
    }

    if (query.isActive !== undefined) {
      and.push({ isActive: query.isActive });
    }

    const createdAtRange = parseCreatedAtFilter(query.createdAt);
    if (createdAtRange) {
      and.push({ createdAt: createdAtRange });
    }

    if (query.search?.trim()) {
      const search = escapeRegex(query.search.trim());
      and.push({
        $or: [
          { 'categoryId.name': new RegExp(search, 'i') },
          { 'brandId.name': new RegExp(search, 'i') },
          { 'productId.name': new RegExp(search, 'i') },
        ],
      });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }
}
