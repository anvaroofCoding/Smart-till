import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildIdFilter,
  escapeRegex,
  parseCreatedAtFilter,
} from '../common/utils/list-filter.utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import {
  AddStockReceiptItemDto,
  AcceptStockReceiptDto,
  CreateStockReceiptDto,
  UpdateStockReceiptDto,
  UpdateStockReceiptItemDto,
} from './dto/stock-receipt.dto';
import { StockReceiptsQueryDto } from './dto/stock-receipts-query.dto';
import {
  emptyPaginatedMeta,
  isWarehouseAllowed,
  normalizeWarehouseId,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import { toStockReceiptResponse } from './stock-receipts.mapper';
import {
  StockReceipt,
  StockReceiptDocument,
} from './schemas/stock-receipt.schema';

@Injectable()
export class StockReceiptsService {
  constructor(
    @InjectModel(StockReceipt.name)
    private readonly receiptModel: Model<StockReceiptDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(
    dto: CreateStockReceiptDto,
    scope?: UserWarehouseScope,
  ): Promise<StockReceiptDocument> {
    await this.ensureSupplierExists(dto.supplierId);
    await this.ensureWarehouseExists(dto.warehouseId);
    this.ensureWarehouseAllowed(scope, dto.warehouseId);

    return this.receiptModel.create({
      name: dto.name.trim(),
      paymentType: dto.paymentType,
      supplierId: new Types.ObjectId(dto.supplierId),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      exchangeRate: dto.exchangeRate,
      notes: dto.notes?.trim() ?? '',
      status: 'in_progress',
      items: [],
    });
  }

  async findAll(pagination: StockReceiptsQueryDto, scope?: UserWarehouseScope) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const skip = (page - 1) * perPage;

    if (scope && !scope.allWarehouses && scope.warehouseIds.length === 0) {
      return {
        data: [],
        meta: emptyPaginatedMeta(page, perPage),
      };
    }

    const filter = await this.buildListFilter(pagination, scope);

    const [items, total] = await Promise.all([
      this.receiptModel
        .find(filter)
        .populate('supplierId', 'name')
        .populate('warehouseId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.receiptModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toStockReceiptResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string): Promise<StockReceiptDocument> {
    const receipt = await this.receiptModel
      .findById(id)
      .populate('supplierId', 'name')
      .populate('warehouseId', 'name')
      .exec();

    if (!receipt) {
      throw new NotFoundException('Kirim topilmadi');
    }

    return receipt;
  }

  async findByIdResponse(id: string, scope?: UserWarehouseScope) {
    const receipt = await this.findById(id);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));
    return toStockReceiptResponse(receipt);
  }

  async update(
    id: string,
    dto: UpdateStockReceiptDto,
    scope?: UserWarehouseScope,
  ) {
    const receipt = await this.findEditableReceipt(id);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Kirim nomi bo\'sh bo\'lmasligi kerak');
      }
      receipt.name = name;
    }

    if (dto.paymentType !== undefined) {
      receipt.paymentType = dto.paymentType;
    }

    if (dto.supplierId !== undefined) {
      await this.ensureSupplierExists(dto.supplierId);
      receipt.supplierId = new Types.ObjectId(dto.supplierId);
    }

    if (dto.warehouseId !== undefined) {
      await this.ensureWarehouseExists(dto.warehouseId);
      this.ensureWarehouseAllowed(scope, dto.warehouseId);
      receipt.warehouseId = new Types.ObjectId(dto.warehouseId);
    }

    if (dto.exchangeRate !== undefined) {
      receipt.exchangeRate = dto.exchangeRate;
    }

    if (dto.notes !== undefined) {
      receipt.notes = dto.notes.trim();
    }

    await receipt.save();
    return this.findById(id);
  }

  async addItem(
    receiptId: string,
    dto: AddStockReceiptItemDto,
    scope?: UserWarehouseScope,
  ) {
    const receipt = await this.findEditableReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));
    const product = await this.ensureProductExists(dto.productId);

    const existingItem = receipt.items.find(
      (item) => item.productId.toString() === dto.productId,
    );

    if (existingItem) {
      throw new ConflictException(
        'Bu maxsulot allaqachon qo\'shilgan. Miqdorni tahrirlang.',
      );
    }

    receipt.items.push({
      productId: new Types.ObjectId(dto.productId),
      productName: product.name,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
    });

    receipt.markModified('items');
    await receipt.save();
    return this.findById(receiptId);
  }

  async updateItem(
    receiptId: string,
    itemId: string,
    dto: UpdateStockReceiptItemDto,
    scope?: UserWarehouseScope,
  ) {
    const receipt = await this.findEditableReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));
    const item = this.findReceiptItem(receipt, itemId);

    if (dto.quantity !== undefined) {
      item.quantity = dto.quantity;
    }

    if (dto.unitPrice !== undefined) {
      item.unitPrice = dto.unitPrice;
    }

    receipt.markModified('items');
    await receipt.save();
    return this.findById(receiptId);
  }

  async removeItem(
    receiptId: string,
    itemId: string,
    scope?: UserWarehouseScope,
  ) {
    const receipt = await this.findEditableReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));
    const itemIndex = receipt.items.findIndex(
      (item) =>
        (item as typeof item & { _id?: Types.ObjectId })._id?.toString() ===
        itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Maxsulot qatori topilmadi');
    }

    receipt.items.splice(itemIndex, 1);
    receipt.markModified('items');
    await receipt.save();
    return this.findById(receiptId);
  }

  async accept(
    receiptId: string,
    dto: AcceptStockReceiptDto,
    scope?: UserWarehouseScope,
  ) {
    const receipt = await this.findInProgressReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));

    if (!receipt.submittedAt) {
      throw new BadRequestException(
        'Faqat yuborilgan kirimni qabul qilish mumkin',
      );
    }

    if (!receipt.items.length) {
      throw new BadRequestException(
        'Kamida bitta maxsulot qo\'shilgan bo\'lishi kerak',
      );
    }

    if (dto.items.length !== receipt.items.length) {
      throw new BadRequestException(
        'Barcha maxsulotlar bo\'yicha qabul ma\'lumotini kiriting',
      );
    }

    const warehouseId = receipt.warehouseId;
    let receivedCount = 0;

    for (const entry of dto.items) {
      const item = this.findReceiptItem(receipt, entry.itemId);

      if (!entry.received) {
        item.receivedQuantity = 0;
        continue;
      }

      const receivedQuantity =
        entry.receivedQuantity !== undefined
          ? entry.receivedQuantity
          : item.quantity;

      if (receivedQuantity <= 0) {
        throw new BadRequestException(
          `${item.productName} uchun qabul miqdorini kiriting`,
        );
      }

      if (receivedQuantity > item.quantity) {
        throw new BadRequestException(
          `${item.productName} uchun qabul miqdori buyurtmadan oshmasligi kerak`,
        );
      }

      item.receivedQuantity = receivedQuantity;
      receivedCount += 1;

      await this.stockModel.findOneAndUpdate(
        {
          warehouseId,
          productId: item.productId,
        },
        {
          $inc: { quantity: receivedQuantity },
          $setOnInsert: {
            warehouseId,
            productId: item.productId,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (receivedCount === 0) {
      throw new BadRequestException('Kamida bitta maxsulotni qabul qiling');
    }

    receipt.markModified('items');
    receipt.status = 'completed';
    await receipt.save();
    return this.findById(receiptId);
  }

  async cancel(receiptId: string, scope?: UserWarehouseScope) {
    const receipt = await this.findInProgressReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));
    receipt.status = 'cancelled';
    await receipt.save();
    return this.findById(receiptId);
  }

  async submit(receiptId: string, scope?: UserWarehouseScope) {
    const receipt = await this.findEditableReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, normalizeWarehouseId(receipt.warehouseId));

    if (!receipt.items.length) {
      throw new BadRequestException(
        'Kamida bitta maxsulot qo\'shilgan bo\'lishi kerak',
      );
    }

    receipt.submittedAt = new Date();
    await receipt.save();
    return this.findById(receiptId);
  }

  private async findInProgressReceipt(id: string): Promise<StockReceiptDocument> {
    const receipt = await this.receiptModel.findById(id).exec();

    if (!receipt) {
      throw new NotFoundException('Kirim topilmadi');
    }

    if (receipt.status !== 'in_progress') {
      throw new ConflictException(
        'Faqat jarayondagi kirim bilan ishlash mumkin',
      );
    }

    return receipt;
  }

  private async findEditableReceipt(id: string): Promise<StockReceiptDocument> {
    const receipt = await this.findInProgressReceipt(id);

    if (receipt.submittedAt) {
      throw new ConflictException(
        'Yuborilgan kirimni tahrirlab bo\'lmaydi',
      );
    }

    return receipt;
  }

  private findReceiptItem(receipt: StockReceiptDocument, itemId: string) {
    const item = receipt.items.find(
      (entry) =>
        (entry as typeof entry & { _id?: Types.ObjectId })._id?.toString() ===
        itemId,
    );

    if (!item) {
      throw new NotFoundException('Maxsulot qatori topilmadi');
    }

    return item;
  }

  private ensureWarehouseAllowed(
    scope: UserWarehouseScope | undefined,
    warehouseId: unknown,
  ) {
    if (isWarehouseAllowed(scope, warehouseId)) {
      return;
    }

    throw new ForbiddenException('Bu omborga ruxsatingiz yo\'q');
  }

  private async ensureSupplierExists(id: string) {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new BadRequestException('Yetkazib beruvchi topilmadi');
    }
    if (!supplier.isActive) {
      throw new BadRequestException('Yetkazib beruvchi faol emas');
    }
    return supplier;
  }

  private async ensureWarehouseExists(id: string) {
    const warehouse = await this.warehouseModel.findById(id).exec();
    if (!warehouse) {
      throw new BadRequestException('Ombor topilmadi');
    }
    if (!warehouse.isActive) {
      throw new BadRequestException('Ombor faol emas');
    }
    return warehouse;
  }

  private async ensureProductExists(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new BadRequestException('Maxsulot topilmadi');
    }
    if (!product.isActive) {
      throw new BadRequestException('Maxsulot faol emas');
    }
    return product;
  }

  private async buildListFilter(
    query: StockReceiptsQueryDto,
    scope?: UserWarehouseScope,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [];

    if (scope && !scope.allWarehouses) {
      and.push({ warehouseId: { $in: scope.warehouseIds } });
    }

    const idFilter = buildIdFilter(query.id);
    if (idFilter) and.push(idFilter);

    if (query.name?.trim()) {
      and.push({ name: new RegExp(escapeRegex(query.name.trim()), 'i') });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    if (query.paymentType) {
      and.push({ paymentType: query.paymentType });
    }

    if (query.supplierId) {
      and.push({ supplierId: new Types.ObjectId(query.supplierId) });
    } else if (query.supplierName?.trim()) {
      const suppliers = await this.supplierModel
        .find({
          name: new RegExp(escapeRegex(query.supplierName.trim()), 'i'),
        })
        .select('_id')
        .exec();

      and.push({
        supplierId: {
          $in: suppliers.map((supplier) => supplier._id),
        },
      });
    }

    if (query.warehouseId) {
      and.push({ warehouseId: new Types.ObjectId(query.warehouseId) });
    } else if (query.warehouseName?.trim()) {
      const warehouses = await this.warehouseModel
        .find({
          name: new RegExp(escapeRegex(query.warehouseName.trim()), 'i'),
        })
        .select('_id')
        .exec();

      and.push({
        warehouseId: {
          $in: warehouses.map((warehouse) => warehouse._id),
        },
      });
    }

    const createdAtRange = parseCreatedAtFilter(query.createdAt);
    if (createdAtRange) {
      and.push({ createdAt: createdAtRange });
    }

    if (query.exchangeRate !== undefined && !Number.isNaN(query.exchangeRate)) {
      and.push({
        exchangeRate: {
          $gte: query.exchangeRate - 0.0001,
          $lte: query.exchangeRate + 0.0001,
        },
      });
    }

    if (query.totalAmount !== undefined && !Number.isNaN(query.totalAmount)) {
      and.push({
        $expr: {
          $let: {
            vars: { total: buildReceiptItemsTotalExpr() },
            in: {
              $and: [
                { $gte: ['$$total', query.totalAmount! - 0.01] },
                { $lte: ['$$total', query.totalAmount! + 0.01] },
              ],
            },
          },
        },
      });
    }

    if (query.submitted === true) {
      and.push({ submittedAt: { $ne: null } });
    } else if (query.submitted === false) {
      and.push({
        $or: [{ submittedAt: null }, { submittedAt: { $exists: false } }],
      });
    }

    if (query.search?.trim()) {
      const search = escapeRegex(query.search.trim());
      const regex = new RegExp(search, 'i');
      and.push({
        $or: [{ name: regex }, { notes: regex }],
      });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }
}

function buildReceiptItemsTotalExpr() {
  return {
    $reduce: {
      input: { $ifNull: ['$items', []] },
      initialValue: 0,
      in: {
        $add: [
          '$$value',
          {
            $multiply: [
              {
                $cond: {
                  if: {
                    $and: [
                      { $eq: ['$status', 'completed'] },
                      {
                        $ne: [
                          { $ifNull: ['$$this.receivedQuantity', null] },
                          null,
                        ],
                      },
                    ],
                  },
                  then: { $ifNull: ['$$this.receivedQuantity', 0] },
                  else: { $ifNull: ['$$this.quantity', 0] },
                },
              },
              { $ifNull: ['$$this.unitPrice', 0] },
            ],
          },
        ],
      },
    },
  };
}
