import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildEan13Barcode } from '../common/utils/barcode.utils';
import { ProductBarcodeResponseDto } from './dto/product-barcode.dto';
import {
  ProductBarcode,
  ProductBarcodeDocument,
  ProductBarcodeSource,
} from './schemas/product-barcode.schema';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductBarcodesService implements OnModuleInit {
  constructor(
    @InjectModel(ProductBarcode.name)
    private readonly barcodeModel: Model<ProductBarcodeDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async onModuleInit() {
    await this.backfillPrimaryBarcodes();
  }

  async listByProductId(productId: string): Promise<ProductBarcodeResponseDto[]> {
    this.assertValidProductId(productId);
    await this.ensurePrimaryBarcode(productId);

    const rows = await this.barcodeModel
      .find({ productId: new Types.ObjectId(productId) })
      .sort({ isPrimary: -1, createdAt: 1 })
      .exec();

    return rows.map((row) => this.toResponse(row));
  }

  async ensurePrimaryBarcode(productId: string): Promise<string> {
    this.assertValidProductId(productId);

    const objectId = new Types.ObjectId(productId);
    const existingPrimary = await this.barcodeModel
      .findOne({ productId: objectId, isPrimary: true })
      .exec();

    if (existingPrimary) {
      await this.syncProductBarcodeField(productId, existingPrimary.value);
      return existingPrimary.value;
    }

    const product = await this.productModel
      .findById(productId)
      .select('barcode')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException('Maxsulot topilmadi');
    }

    const current = product.barcode?.trim();
    if (current) {
      await this.createBarcodeRecord(productId, current, 'system', true);
      return current;
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const barcode = await this.generateUniqueBarcode(attempt);
      const created = await this.barcodeModel
        .findOneAndUpdate(
          {
            productId: objectId,
            isPrimary: true,
          },
          {
            $setOnInsert: {
              productId: objectId,
              value: barcode,
              source: 'system',
              isPrimary: true,
            },
          },
          { upsert: true, new: true },
        )
        .exec();

      if (created?.value) {
        await this.syncProductBarcodeField(productId, created.value);
        return created.value;
      }

      const refreshed = await this.barcodeModel
        .findOne({ productId: objectId, isPrimary: true })
        .exec();
      if (refreshed?.value) {
        await this.syncProductBarcodeField(productId, refreshed.value);
        return refreshed.value;
      }
    }

    throw new ConflictException('Barkod yaratib bo\'lmadi');
  }

  async ensureBarcodes(productIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    const result = new Map<string, string>();

    for (const productId of uniqueIds) {
      try {
        const barcode = await this.ensurePrimaryBarcode(productId);
        result.set(productId, barcode);
      } catch {
        // O'chirilgan maxsulotlar ro'yxatni buzmasin.
      }
    }

    return result;
  }

  async addManualBarcode(
    productId: string,
    rawValue: string,
  ): Promise<ProductBarcodeResponseDto> {
    this.assertValidProductId(productId);
    await this.ensureProductExists(productId);

    const value = rawValue.trim();
    if (!value) {
      throw new BadRequestException('Barkod qiymatini kiriting');
    }

    const duplicateForProduct = await this.barcodeModel
      .findOne({
        productId: new Types.ObjectId(productId),
        value,
      })
      .exec();

    if (duplicateForProduct) {
      throw new ConflictException('Bu maxsulotda bunday barkod allaqachon mavjud');
    }

    const usedElsewhere = await this.barcodeModel.findOne({ value }).exec();
    if (usedElsewhere) {
      throw new ConflictException('Bu barkod boshqa maxsulotda ishlatilgan');
    }

    const usedOnProduct = await this.productModel
      .findOne({ barcode: value, _id: { $ne: productId } })
      .select('_id')
      .lean()
      .exec();

    if (usedOnProduct) {
      throw new ConflictException('Bu barkod boshqa maxsulotda ishlatilgan');
    }

    const row = await this.barcodeModel.create({
      productId: new Types.ObjectId(productId),
      value,
      source: 'manual',
      isPrimary: false,
    });

    return this.toResponse(row);
  }

  async removeBarcode(productId: string, barcodeId: string): Promise<void> {
    this.assertValidProductId(productId);

    if (!Types.ObjectId.isValid(barcodeId)) {
      throw new BadRequestException('Barkod ID noto\'g\'ri');
    }

    const row = await this.barcodeModel.findById(barcodeId).exec();
    if (!row || row.productId.toString() !== productId) {
      throw new NotFoundException('Barkod topilmadi');
    }

    if (row.isPrimary) {
      throw new BadRequestException('Asosiy barkodni o\'chirib bo\'lmaydi');
    }

    await row.deleteOne();
  }

  async getBarcodesMap(
    productIds: string[],
  ): Promise<Map<string, string[]>> {
    const uniqueIds = [
      ...new Set(productIds.filter((id) => Types.ObjectId.isValid(id))),
    ];

    const result = new Map<string, string[]>();
    if (uniqueIds.length === 0) {
      return result;
    }

    const rows = await this.barcodeModel
      .find({
        productId: {
          $in: uniqueIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean()
      .exec();

    for (const row of rows) {
      const key = row.productId.toString();
      const current = result.get(key) ?? [];
      current.push(row.value);
      result.set(key, current);
    }

    return result;
  }

  async findProductIdsByBarcodeSearch(search: string): Promise<Types.ObjectId[]> {
    const trimmed = search.trim();
    if (!trimmed) {
      return [];
    }

    const regex = new RegExp(escapeRegex(trimmed), 'i');
    const [barcodeProductIds, legacyProductIds] = await Promise.all([
      this.barcodeModel.find({ value: regex }).distinct('productId').exec(),
      this.productModel.find({ barcode: regex }).distinct('_id').exec(),
    ]);

    const merged = new Set<string>([
      ...barcodeProductIds.map((id) => id.toString()),
      ...legacyProductIds.map((id) => id.toString()),
    ]);

    return [...merged].map((id) => new Types.ObjectId(id));
  }

  async findProductIdByExactBarcode(value: string): Promise<string | null> {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const row = await this.barcodeModel.findOne({ value: normalized }).exec();
    if (row) {
      return row.productId.toString();
    }

    const product = await this.productModel
      .findOne({ barcode: normalized })
      .select('_id')
      .lean()
      .exec();

    return product?._id?.toString() ?? null;
  }

  private async backfillPrimaryBarcodes() {
    const products = await this.productModel
      .find({ barcode: { $exists: true, $nin: [null, ''] } })
      .select('_id barcode')
      .lean()
      .exec();

    for (const product of products) {
      const productId = product._id.toString();
      const value = product.barcode?.trim();
      if (!value) continue;

      const exists = await this.barcodeModel.exists({
        productId: product._id,
        isPrimary: true,
      });

      if (exists) continue;

      try {
        await this.createBarcodeRecord(productId, value, 'system', true);
      } catch {
        // Unikal indeks to'qnashuvi — boshqa jarayon yaratgan bo'lishi mumkin.
      }
    }
  }

  private async createBarcodeRecord(
    productId: string,
    value: string,
    source: ProductBarcodeSource,
    isPrimary: boolean,
  ) {
    const objectId = new Types.ObjectId(productId);

    if (isPrimary) {
      await this.barcodeModel.deleteMany({
        productId: objectId,
        isPrimary: true,
      });
    }

    await this.barcodeModel.create({
      productId: objectId,
      value,
      source,
      isPrimary,
    });

    if (isPrimary) {
      await this.syncProductBarcodeField(productId, value);
    }
  }

  private async syncProductBarcodeField(productId: string, barcode: string) {
    await this.productModel
      .updateOne({ _id: productId }, { $set: { barcode } })
      .exec();
  }

  private async generateUniqueBarcode(attemptOffset = 0): Promise<string> {
    const prefix = '200';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const lastBarcode = await this.barcodeModel
        .findOne({ value: { $regex: `^${prefix}\\d{10}$` } })
        .sort({ value: -1 })
        .collation({ locale: 'en', numericOrdering: true })
        .select('value')
        .lean()
        .exec();

      const lastLegacy = await this.productModel
        .findOne({ barcode: { $regex: `^${prefix}\\d{10}$` } })
        .sort({ barcode: -1 })
        .collation({ locale: 'en', numericOrdering: true })
        .select('barcode')
        .lean()
        .exec();

      let next = 1;
      const candidates = [lastBarcode?.value, lastLegacy?.barcode].filter(Boolean);
      const highest = candidates.sort((left, right) =>
        (right ?? '').localeCompare(left ?? '', 'en', { numeric: true }),
      )[0];

      if (highest) {
        const parsed = Number.parseInt(highest.slice(prefix.length, 12), 10);
        if (!Number.isNaN(parsed)) {
          next = parsed + 1 + attempt + attemptOffset;
        }
      } else {
        next = 1 + attempt + attemptOffset;
      }

      const base12 = `${prefix}${String(next).padStart(9, '0')}`;
      const barcode = buildEan13Barcode(base12);

      const [existsInBarcodes, existsInProducts] = await Promise.all([
        this.barcodeModel.exists({ value: barcode }).exec(),
        this.productModel.exists({ barcode }).exec(),
      ]);

      if (!existsInBarcodes && !existsInProducts) {
        return barcode;
      }
    }

    throw new ConflictException('Barkod yaratib bo\'lmadi');
  }

  private async ensureProductExists(productId: string) {
    const exists = await this.productModel.exists({ _id: productId }).exec();
    if (!exists) {
      throw new NotFoundException('Maxsulot topilmadi');
    }
  }

  private assertValidProductId(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Maxsulot ID noto\'g\'ri');
    }
  }

  private toResponse(row: ProductBarcodeDocument): ProductBarcodeResponseDto {
    return {
      id: row._id.toString(),
      productId: row.productId.toString(),
      value: row.value,
      source: row.source,
      isPrimary: row.isPrimary,
      createdAt: (row as ProductBarcodeDocument & { createdAt: Date }).createdAt,
    };
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
