import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../stock-movements/schemas/stock-movement.schema';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import {
  emptyPaginatedMeta,
  isWarehouseAllowed,
  normalizeWarehouseId,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import {
  escapeRegex,
  parseDateKeyFilter,
} from '../common/utils/list-filter.utils';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductBarcodesService } from '../products/product-barcodes.service';
import {
  AcceptWarehouseTransferDto,
  CreateWarehouseTransferDraftDto,
  CreateWarehouseTransferDto,
  SendWarehouseTransferDraftDto,
  UpdateAcceptanceProgressDto,
  UpdateWarehouseTransferDraftDto,
  WarehouseTransfersQueryDto,
  WarehouseTransferResponseDto,
} from './dto/warehouse-transfer.dto';
import { toWarehouseTransferResponse } from './warehouse-transfers.mapper';
import {
  WarehouseTransfer,
  WarehouseTransferDocument,
  WarehouseTransferItem,
} from './schemas/warehouse-transfer.schema';

const DRAFT_LOOKUP_INDEX = 'fromWarehouseId_1_createdByUserId_1_status_1';

@Injectable()
export class WarehouseTransfersService implements OnModuleInit {
  constructor(
    @InjectModel(WarehouseTransfer.name)
    private readonly transferModel: Model<WarehouseTransferDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly productBarcodesService: ProductBarcodesService,
  ) {}

  async onModuleInit() {
    const indexes = await this.transferModel.collection.indexes();
    const draftIndex = indexes.find((index) => index.name === DRAFT_LOOKUP_INDEX);

    if (draftIndex?.unique) {
      await this.transferModel.collection.dropIndex(DRAFT_LOOKUP_INDEX);
      await this.transferModel.syncIndexes();
    }
  }

  async findAll(query: WarehouseTransfersQueryDto, scope?: UserWarehouseScope) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    if (scope && !scope.allWarehouses && scope.warehouseIds.length === 0) {
      return {
        data: [],
        meta: emptyPaginatedMeta(page, perPage),
      };
    }

    const filter = this.buildListFilter(query, scope);

    const [items, total] = await Promise.all([
      this.transferModel
        .find(filter)
        .populate('fromWarehouseId', 'name')
        .populate('toWarehouseId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.transferModel.countDocuments(filter),
    ]);

    return {
      data: await this.mapTransferResponses(items),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string, scope?: UserWarehouseScope) {
    const transfer = await this.loadTransfer(id);
    this.ensureTransferVisible(scope, transfer);
    return await this.mapTransferResponse(transfer);
  }

  async findCurrentDraft(
    fromWarehouseId: string,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    this.ensureWarehouseAllowed(scope, fromWarehouseId);

    const transfer = await this.transferModel
      .findOne({
        status: 'draft',
        fromWarehouseId: new Types.ObjectId(fromWarehouseId),
        createdByUserId: new Types.ObjectId(userId),
      })
      .populate('fromWarehouseId', 'name')
      .populate('toWarehouseId', 'name')
      .exec();

    if (!transfer) {
      return null;
    }

    return await this.mapTransferResponse(transfer);
  }

  async listDestinationWarehouses(
    fromWarehouseId: string,
    scope?: UserWarehouseScope,
  ) {
    if (!fromWarehouseId?.trim()) {
      throw new BadRequestException('Yuboruvchi omborni tanlang');
    }

    await this.ensureWarehouseExists(fromWarehouseId);
    this.ensureWarehouseAllowed(scope, fromWarehouseId);

    const warehouses = await this.warehouseModel
      .find({
        isActive: true,
        _id: { $ne: new Types.ObjectId(fromWarehouseId) },
      })
      .sort({ name: 1 })
      .select('name')
      .lean()
      .exec();

    return warehouses.map((warehouse) => ({
      id: warehouse._id.toString(),
      name: warehouse.name,
    }));
  }

  async createDraft(
    dto: CreateWarehouseTransferDraftDto,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Yuboruvchi va qabul qiluvchi ombor bir xil bo\'lmasligi kerak',
      );
    }

    await this.ensureWarehouseExists(dto.fromWarehouseId);
    await this.ensureWarehouseExists(dto.toWarehouseId);
    this.ensureWarehouseAllowed(scope, dto.fromWarehouseId);

    const items = dto.items ?? [];
    const preparedItems =
      items.length > 0
        ? await this.prepareTransferItems(dto.fromWarehouseId, items)
        : [];
    const code = await this.generateTransferCode();
    const transferDate =
      dto.transferDate?.trim() ||
      new Date().toISOString().slice(0, 10);

    const transfer = await this.transferModel.create({
      code,
      name: dto.name.trim(),
      fromWarehouseId: new Types.ObjectId(dto.fromWarehouseId),
      toWarehouseId: new Types.ObjectId(dto.toWarehouseId),
      transferDate,
      status: 'draft',
      items: preparedItems,
      notes: dto.notes?.trim() ?? '',
      createdByUserId: new Types.ObjectId(userId),
    });

    const populated = await this.loadTransfer(transfer._id.toString());
    return await this.mapTransferResponse(populated);
  }

  async updateDraft(
    id: string,
    dto: UpdateWarehouseTransferDraftDto,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    const transfer = await this.loadTransfer(id);
    this.ensureDraftEditable(transfer, userId, scope);

    if (dto.items.length === 0) {
      transfer.items = [];
      transfer.markModified('items');
      await transfer.save();
      const populated = await this.loadTransfer(id);
      return await this.mapTransferResponse(populated);
    }

    const preparedItems = await this.prepareTransferItems(
      this.resolveTransferWarehouseId(transfer.fromWarehouseId),
      dto.items,
    );

    transfer.items = preparedItems;
    transfer.markModified('items');
    await transfer.save();

    const populated = await this.loadTransfer(id);
    return await this.mapTransferResponse(populated);
  }

  async sendDraft(
    id: string,
    dto: SendWarehouseTransferDraftDto,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    const transfer = await this.loadTransfer(id);
    this.ensureDraftEditable(transfer, userId, scope);

    if (!transfer.items.length) {
      throw new BadRequestException('Kamida bitta maxsulot qo\'shing');
    }

    const fromWarehouseId = this.resolveTransferWarehouseId(transfer.fromWarehouseId);

    if (fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Yuboruvchi va qabul qiluvchi ombor bir xil bo\'lmasligi kerak',
      );
    }

    const toWarehouseId =
      dto.toWarehouseId ?? normalizeWarehouseId(transfer.toWarehouseId) ?? '';
    const transferDate = dto.transferDate ?? transfer.transferDate;
    const notes = dto.notes?.trim() ?? transfer.notes ?? '';

    if (!toWarehouseId) {
      throw new BadRequestException('Qabul qiluvchi omborni tanlang');
    }

    if (!transferDate?.trim()) {
      throw new BadRequestException('Sanani tanlang');
    }

    await this.ensureWarehouseExists(toWarehouseId);

    const preparedItems = await this.prepareTransferItems(
      fromWarehouseId,
      transfer.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      })),
    );

    transfer.items = preparedItems;
    transfer.toWarehouseId = new Types.ObjectId(toWarehouseId);
    transfer.transferDate = transferDate;
    transfer.notes = notes;
    transfer.status = 'sent';
    transfer.sentByUserId = new Types.ObjectId(userId);
    transfer.sentAt = new Date();
    transfer.markModified('items');
    await transfer.save();

    const sourceName = `Transfer ${transfer.code}`;

    for (const item of preparedItems) {
      await this.deductStock(
        fromWarehouseId,
        item.productId,
        item.quantity,
        item.unitPrice,
        sourceName,
        transfer._id,
      );
    }

    const populated = await this.loadTransfer(id);
    await this.notificationsService.notifyWarehouseTransferSent(populated);

    return await this.mapTransferResponse(populated);
  }

  async createAndSend(
    dto: CreateWarehouseTransferDto,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Yuboruvchi va qabul qiluvchi ombor bir xil bo\'lmasligi kerak',
      );
    }

    await this.ensureWarehouseExists(dto.fromWarehouseId);
    await this.ensureWarehouseExists(dto.toWarehouseId);
    this.ensureWarehouseAllowed(scope, dto.fromWarehouseId);

    const preparedItems = await this.prepareTransferItems(
      dto.fromWarehouseId,
      dto.items,
    );

    const code = await this.generateTransferCode();

    const transfer = await this.transferModel.create({
      code,
      fromWarehouseId: new Types.ObjectId(dto.fromWarehouseId),
      toWarehouseId: new Types.ObjectId(dto.toWarehouseId),
      transferDate: dto.transferDate,
      status: 'sent',
      items: preparedItems,
      notes: dto.notes?.trim() ?? '',
      createdByUserId: new Types.ObjectId(userId),
      sentByUserId: new Types.ObjectId(userId),
      sentAt: new Date(),
    });

    const sourceName = `Transfer ${code}`;

    for (const item of preparedItems) {
      await this.deductStock(
        dto.fromWarehouseId,
        item.productId,
        item.quantity,
        item.unitPrice,
        sourceName,
        transfer._id,
      );
    }

    const populated = await this.loadTransfer(transfer._id.toString());
    await this.notificationsService.notifyWarehouseTransferSent(populated);

    return await this.mapTransferResponse(populated);
  }

  async updateAcceptanceProgress(
    transferId: string,
    dto: UpdateAcceptanceProgressDto,
    scope?: UserWarehouseScope,
  ) {
    const transfer = await this.loadTransfer(transferId);

    if (transfer.status !== 'sent') {
      throw new ConflictException(
        'Faqat yuborilgan transfer uchun qabul jarayonini saqlash mumkin',
      );
    }

    if (!transfer.toWarehouseId) {
      throw new BadRequestException('Qabul qiluvchi ombor topilmadi');
    }

    this.ensureWarehouseAllowed(scope, transfer.toWarehouseId);

    if (dto.items.length !== transfer.items.length) {
      throw new BadRequestException(
        'Barcha maxsulotlar bo\'yicha qabul ma\'lumotini kiriting',
      );
    }

    for (const entry of dto.items) {
      const item = this.findTransferItem(transfer, entry.itemId);

      if (entry.receivedQuantity < 0) {
        throw new BadRequestException(
          `${item.productName} uchun qabul miqdori manfiy bo\'lmasligi kerak`,
        );
      }

      if (entry.receivedQuantity > item.quantity) {
        throw new BadRequestException(
          `${item.productName} uchun qabul miqdori yuborilgandan oshmasligi kerak`,
        );
      }

      item.receivedQuantity = entry.receivedQuantity;
      item.receivedMarked = entry.received;
    }

    transfer.markModified('items');
    await transfer.save();

    const populated = await this.loadTransfer(transferId);
    return await this.mapTransferResponse(populated);
  }

  async accept(
    transferId: string,
    dto: AcceptWarehouseTransferDto,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    const transfer = await this.loadTransfer(transferId);

    if (transfer.status !== 'sent') {
      throw new ConflictException('Faqat yuborilgan transferni qabul qilish mumkin');
    }

    if (!transfer.toWarehouseId) {
      throw new BadRequestException('Qabul qiluvchi ombor topilmadi');
    }

    this.ensureWarehouseAllowed(scope, transfer.toWarehouseId);

    if (dto.items.length !== transfer.items.length) {
      throw new BadRequestException(
        'Barcha maxsulotlar bo\'yicha qabul ma\'lumotini kiriting',
      );
    }

    const sourceName = `Transfer ${transfer.code}`;
    let receivedCount = 0;

    for (const entry of dto.items) {
      const item = this.findTransferItem(transfer, entry.itemId);

      if (!entry.received) {
        item.receivedQuantity = 0;
        const returned = item.quantity;
        if (returned > 0) {
          await this.addStock(
            transfer.fromWarehouseId,
            item.productId,
            returned,
            item.unitPrice,
            sourceName,
            'transfer_return',
            transfer._id,
          );
        }
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
          `${item.productName} uchun qabul miqdori yuborilgandan oshmasligi kerak`,
        );
      }

      item.receivedQuantity = receivedQuantity;
      receivedCount += 1;

      await this.addStock(
        transfer.toWarehouseId,
        item.productId,
        receivedQuantity,
        item.unitPrice,
        sourceName,
        'transfer_accept',
        transfer._id,
      );

      const returnedQuantity = item.quantity - receivedQuantity;
      if (returnedQuantity > 0) {
        await this.addStock(
          transfer.fromWarehouseId,
          item.productId,
          returnedQuantity,
          item.unitPrice,
          sourceName,
          'transfer_return',
          transfer._id,
        );
      }
    }

    if (receivedCount === 0) {
      throw new BadRequestException('Kamida bitta maxsulotni qabul qiling');
    }

    transfer.markModified('items');
    transfer.status = 'completed';
    transfer.completedAt = new Date();
    transfer.acceptedByUserId = new Types.ObjectId(userId);
    await transfer.save();

    const populated = await this.loadTransfer(transferId);
    await this.notificationsService.notifyWarehouseTransferAccept(
      populated,
      dto,
      userId,
    );

    return await this.mapTransferResponse(populated);
  }

  private async prepareTransferItems(
    fromWarehouseId: string,
    items: CreateWarehouseTransferDto['items'],
  ) {
    const warehouseId = normalizeWarehouseId(fromWarehouseId);
    if (!warehouseId) {
      throw new BadRequestException('Ombor topilmadi');
    }

    const uniqueProductIds = new Set(items.map((item) => item.productId));
    if (uniqueProductIds.size !== items.length) {
      throw new BadRequestException('Bir xil maxsulotni ikki marta qo\'shib bo\'lmaydi');
    }

    const prepared: Array<{
      productId: Types.ObjectId;
      productName: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const line of items) {
      const product = await this.productModel.findById(line.productId).exec();
      if (!product || !product.isActive) {
        throw new BadRequestException('Maxsulot topilmadi');
      }

      const stock = await this.stockModel
        .findOne({
          warehouseId: new Types.ObjectId(warehouseId),
          productId: product._id,
        })
        .exec();

      const available = stock?.quantity ?? 0;
      if (available < line.quantity) {
        throw new BadRequestException(
          `${product.name} uchun omborda yetarli miqdor yo'q (mavjud: ${available}, kerak: ${line.quantity})`,
        );
      }

      prepared.push({
        productId: product._id,
        productName: product.name,
        quantity: line.quantity,
        unitPrice: stock?.lastUnitPrice ?? 0,
      });
    }

    return prepared;
  }

  private async deductStock(
    warehouseId: string,
    productId: Types.ObjectId,
    quantity: number,
    unitPrice: number,
    sourceName: string,
    transferId: Types.ObjectId,
  ) {
    const updatedStock = await this.stockModel
      .findOneAndUpdate(
        {
          warehouseId: new Types.ObjectId(warehouseId),
          productId,
          quantity: { $gte: quantity },
        },
        {
          $inc: { quantity: -quantity },
        },
        { new: true },
      )
      .exec();

    if (!updatedStock) {
      throw new BadRequestException('Ombor qoldig\'ini yangilab bo\'lmadi');
    }

    await this.movementModel.create({
      warehouseId: new Types.ObjectId(warehouseId),
      productId,
      delta: -quantity,
      balanceAfter: updatedStock.quantity,
      sourceType: 'transfer_send',
      sourceId: transferId,
      sourceName,
      unitPrice,
      exchangeRate: updatedStock.lastExchangeRate ?? 1,
      notes: sourceName,
    });
  }

  private async addStock(
    warehouseId: Types.ObjectId | string,
    productId: Types.ObjectId,
    quantity: number,
    unitPrice: number,
    sourceName: string,
    sourceType: 'transfer_accept' | 'transfer_return',
    transferId: Types.ObjectId,
  ) {
    const warehouseObjectId =
      warehouseId instanceof Types.ObjectId
        ? warehouseId
        : new Types.ObjectId(warehouseId);

    const updatedStock = await this.stockModel
      .findOneAndUpdate(
        {
          warehouseId: warehouseObjectId,
          productId,
        },
        {
          $inc: { quantity },
          $set: {
            lastUnitPrice: unitPrice,
          },
          $setOnInsert: {
            warehouseId: warehouseObjectId,
            productId,
            lastExchangeRate: 1,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    await this.movementModel.create({
      warehouseId: warehouseObjectId,
      productId,
      delta: quantity,
      balanceAfter: updatedStock?.quantity ?? quantity,
      sourceType,
      sourceId: transferId,
      sourceName,
      unitPrice,
      exchangeRate: updatedStock?.lastExchangeRate ?? 1,
      notes: sourceName,
    });
  }

  private buildListFilter(
    query: WarehouseTransfersQueryDto,
    scope?: UserWarehouseScope,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [];

    if (query.status) {
      and.push({ status: query.status });
    }

    if (query.fromWarehouseId) {
      and.push({ fromWarehouseId: new Types.ObjectId(query.fromWarehouseId) });
    }

    if (query.toWarehouseId) {
      and.push({ toWarehouseId: new Types.ObjectId(query.toWarehouseId) });
    }

    if (query.name?.trim()) {
      and.push({
        name: new RegExp(escapeRegex(query.name.trim()), 'i'),
      });
    }

    if (query.code?.trim()) {
      and.push({
        code: new RegExp(escapeRegex(query.code.trim()), 'i'),
      });
    }

    if (query.transferDate?.trim()) {
      const dateFilter = parseDateKeyFilter(query.transferDate);
      if (dateFilter) {
        and.push({ transferDate: dateFilter });
      }
    }

    if (query.itemsCount !== undefined && !Number.isNaN(query.itemsCount)) {
      and.push({
        $expr: { $eq: [{ $size: '$items' }, query.itemsCount] },
      });
    }

    if (scope && !scope.allWarehouses) {
      if (query.direction === 'incoming') {
        and.push({
          toWarehouseId: { $in: scope.warehouseIds },
          ...(query.status
            ? { status: query.status }
            : { status: { $in: ['draft', 'sent', 'completed'] } }),
        });
      } else if (query.direction === 'outgoing') {
        and.push({ fromWarehouseId: { $in: scope.warehouseIds } });
      } else {
        and.push({
          $or: [
            { fromWarehouseId: { $in: scope.warehouseIds } },
            { toWarehouseId: { $in: scope.warehouseIds } },
          ],
        });
      }
    } else if (query.direction === 'incoming') {
      and.push(
        query.status
          ? { status: query.status }
          : { status: { $in: ['draft', 'sent', 'completed'] } },
      );
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }

  private async loadTransfer(id: string) {
    const transfer = await this.transferModel
      .findById(id)
      .populate('fromWarehouseId', 'name')
      .populate('toWarehouseId', 'name')
      .populate('items.productId', 'barcode')
      .exec();

    if (!transfer) {
      throw new NotFoundException('Transfer topilmadi');
    }

    return transfer;
  }

  private findTransferItem(transfer: WarehouseTransferDocument, itemId: string) {
    const item = transfer.items.find(
      (entry) =>
        (entry as WarehouseTransferItem & { _id?: Types.ObjectId })._id?.toString() ===
        itemId,
    );

    if (!item) {
      throw new NotFoundException('Maxsulot qatori topilmadi');
    }

    return item;
  }

  private ensureDraftEditable(
    transfer: WarehouseTransferDocument,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    if (transfer.status !== 'draft') {
      throw new ConflictException('Faqat jarayondagi transferni tahrirlash mumkin');
    }

    if (transfer.createdByUserId?.toString() !== userId) {
      throw new ForbiddenException('Bu transferni tahrirlash huquqi yo\'q');
    }

    this.ensureWarehouseAllowed(scope, transfer.fromWarehouseId);
  }

  private ensureTransferVisible(
    scope: UserWarehouseScope | undefined,
    transfer: WarehouseTransferDocument,
  ) {
    const fromAllowed = isWarehouseAllowed(scope, transfer.fromWarehouseId);
    const toAllowed = isWarehouseAllowed(scope, transfer.toWarehouseId);

    if (!fromAllowed && !toAllowed) {
      throw new ForbiddenException('Bu transferga kirish huquqi yo\'q');
    }
  }

  private ensureWarehouseAllowed(
    scope: UserWarehouseScope | undefined,
    warehouseId: unknown,
  ) {
    if (!isWarehouseAllowed(scope, warehouseId)) {
      throw new ForbiddenException('Bu omborga ruxsatingiz yo\'q');
    }
  }

  private resolveTransferWarehouseId(warehouseId: unknown): string {
    const resolved = normalizeWarehouseId(warehouseId);
    if (!resolved) {
      throw new BadRequestException('Ombor topilmadi');
    }
    return resolved;
  }

  private async ensureWarehouseExists(id: string) {
    const warehouse = await this.warehouseModel.findById(id).exec();
    if (!warehouse || !warehouse.isActive) {
      throw new BadRequestException('Ombor topilmadi');
    }
    return warehouse;
  }

  private async generateTransferCode() {
    const prefix = 'TRF-';
    const padLength = 6;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const last = await this.transferModel
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
      const exists = await this.transferModel.exists({ code }).exec();
      if (!exists) {
        return code;
      }
    }

    throw new ConflictException('Transfer kodi yaratib bo\'lmadi');
  }

  private extractItemProductId(productId: unknown): string {
    if (productId && typeof productId === 'object' && '_id' in productId) {
      return (productId as { _id: Types.ObjectId })._id.toString();
    }

    return (productId as Types.ObjectId).toString();
  }

  private collectTransferProductIds(
    transfer: WarehouseTransferDocument,
  ): string[] {
    return transfer.items.map((item) =>
      this.extractItemProductId(item.productId),
    );
  }

  private async mapTransferResponse(
    transfer: WarehouseTransferDocument,
  ): Promise<WarehouseTransferResponseDto> {
    const barcodesMap = await this.productBarcodesService.getBarcodesMap(
      this.collectTransferProductIds(transfer),
    );

    return toWarehouseTransferResponse(transfer, '', '', barcodesMap);
  }

  private async mapTransferResponses(
    transfers: WarehouseTransferDocument[],
  ): Promise<WarehouseTransferResponseDto[]> {
    const productIds = transfers.flatMap((transfer) =>
      this.collectTransferProductIds(transfer),
    );
    const barcodesMap =
      await this.productBarcodesService.getBarcodesMap(productIds);

    return transfers.map((transfer) =>
      toWarehouseTransferResponse(transfer, '', '', barcodesMap),
    );
  }
}
