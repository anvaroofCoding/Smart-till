import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  emptyPaginatedMeta,
  isWarehouseAllowed,
  normalizeWarehouseId,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Supplier, SupplierDocument } from '../suppliers/schemas/supplier.schema';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import {
  AddStockReceiptItemDto,
  CreateStockReceiptDto,
  UpdateStockReceiptDto,
  UpdateStockReceiptItemDto,
} from './dto/stock-receipt.dto';
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
    if (process.env.DEBUG_WAREHOUSE_SCOPE === 'true') {
      // eslint-disable-next-line no-console
      console.log('stock-receipt.create scope', {
        allWarehouses: scope?.allWarehouses,
        warehouseIds: scope?.warehouseIds?.map((id) =>
          normalizeWarehouseId(id),
        ),
        warehouseId: normalizeWarehouseId(dto.warehouseId),
      });
    }
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

  async findAll(pagination: PaginationDto, scope?: UserWarehouseScope) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const filter: {
      $or?: Array<Record<string, RegExp>>;
      warehouseId?: { $in: Types.ObjectId[] };
    } = {};

    if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return {
          data: [],
          meta: emptyPaginatedMeta(page, perPage),
        };
      }

      filter.warehouseId = { $in: scope.warehouseIds };
    }

    if (pagination.search?.trim()) {
      const search = pagination.search.trim();
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { notes: regex }];
    }

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
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());
    return toStockReceiptResponse(receipt);
  }

  async update(
    id: string,
    dto: UpdateStockReceiptDto,
    scope?: UserWarehouseScope,
  ) {
    const receipt = await this.findEditableReceipt(id);
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());

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
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());
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
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());
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
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());
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

  async accept(receiptId: string, scope?: UserWarehouseScope) {
    const receipt = await this.findEditableReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());

    if (!receipt.items.length) {
      throw new BadRequestException(
        'Kamida bitta maxsulot qo\'shilgan bo\'lishi kerak',
      );
    }

    const warehouseId = receipt.warehouseId;

    for (const item of receipt.items) {
      await this.stockModel.findOneAndUpdate(
        {
          warehouseId,
          productId: item.productId,
        },
        {
          $inc: { quantity: item.quantity },
          $setOnInsert: {
            warehouseId,
            productId: item.productId,
          },
        },
        { upsert: true, new: true },
      );
    }

    receipt.status = 'completed';
    await receipt.save();
    return this.findById(receiptId);
  }

  async cancel(receiptId: string, scope?: UserWarehouseScope) {
    const receipt = await this.findEditableReceipt(receiptId);
    this.ensureWarehouseAllowed(scope, receipt.warehouseId.toString());
    receipt.status = 'cancelled';
    await receipt.save();
    return this.findById(receiptId);
  }

  private async findEditableReceipt(id: string): Promise<StockReceiptDocument> {
    const receipt = await this.receiptModel.findById(id).exec();

    if (!receipt) {
      throw new NotFoundException('Kirim topilmadi');
    }

    if (receipt.status !== 'in_progress') {
      throw new ConflictException(
        'Faqat jarayondagi kirimni tahrirlash mumkin',
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
}
