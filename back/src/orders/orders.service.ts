import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import { escapeRegex, buildIdFilter, parseCreatedAtFilter } from '../common/utils/list-filter.utils';
import {
  emptyPaginatedMeta,
  ensureWarehouseAllowed,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  PaymentType,
  PaymentTypeDocument,
} from '../payment-types/schemas/payment-type.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  CreateDraftOrderDto,
  CreateOrderDto,
  CreateOrderItemDto,
  CreateOrderPaymentDto,
  FulfillOrderDto,
  OrderReceiptDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { toOrderResponse } from './orders.mapper';
import { Order, OrderDocument } from './schemas/order.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../stock-movements/schemas/stock-movement.schema';
import { DailyBalancesService } from '../daily-balances/daily-balances.service';

type OrderItemInput = CreateOrderItemDto;
type OrderPaymentInput = CreateOrderPaymentDto;

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(PaymentType.name)
    private readonly paymentTypeModel: Model<PaymentTypeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    private readonly dailyBalancesService: DailyBalancesService,
  ) {}

  async createDraft(
    dto: CreateDraftOrderDto,
    userId?: string,
    scope?: UserWarehouseScope,
  ): Promise<OrderDocument> {
    await this.ensureProductsExist(dto.items.map((item) => item.productId));

    const items = this.mapItems(dto.items);
    const totals = this.computeTotals(items, []);
    const warehouseId = await this.resolveWarehouseIdForUser(userId, scope);

    const order = await this.orderModel.create({
      items,
      payments: [],
      ...totals,
      status: 'draft',
      ...(userId ? { createdById: new Types.ObjectId(userId) } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    });

    return this.findById(order._id.toString(), scope);
  }

  async create(
    dto: CreateOrderDto,
    userId?: string,
    scope?: UserWarehouseScope,
  ): Promise<OrderDocument> {
    await this.ensureProductsExist(dto.items.map((item) => item.productId));
    await this.ensurePaymentTypesExist(
      dto.payments.map((payment) => payment.paymentTypeId),
    );

    const items = this.mapItems(dto.items);
    const payments = this.mapPayments(dto.payments);
    const totals = this.computeTotals(items, payments);
    this.ensurePaymentTotalValid(totals.total, totals.paidTotal);
    const warehouseId = await this.resolveWarehouseIdForUser(userId, scope);

    const order = await this.orderModel.create({
      customerName: dto.customerName?.trim() ?? '',
      customerPhone: dto.customerPhone.trim(),
      customerRegion: dto.customerRegion?.trim() ?? '',
      customerDistrict: dto.customerDistrict?.trim() ?? '',
      customerArea: dto.customerArea?.trim() ?? '',
      customerAddress: dto.customerAddress?.trim() ?? '',
      comment: dto.comment?.trim() ?? '',
      items,
      payments,
      ...totals,
      status: 'confirmed',
      ...(userId ? { createdById: new Types.ObjectId(userId) } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    });

    await this.dailyBalancesService.recordOrderSale(order._id.toString());

    return this.findById(order._id.toString(), scope);
  }

  async update(
    id: string,
    dto: UpdateOrderDto,
    scope?: UserWarehouseScope,
  ): Promise<OrderDocument> {
    const order = await this.findById(id, scope);

    if (order.status !== 'draft') {
      throw new BadRequestException(
        'Faqat qoralama buyurtmani tahrirlash mumkin',
      );
    }

    if (dto.items) {
      await this.ensureProductsExist(dto.items.map((item) => item.productId));
      order.items = this.mapItems(dto.items);
    }

    if (dto.payments) {
      await this.ensurePaymentTypesExist(
        dto.payments.map((payment) => payment.paymentTypeId),
      );
      order.payments = this.mapPayments(dto.payments);
    }

    if (dto.customerName !== undefined) {
      order.customerName = dto.customerName.trim();
    }
    if (dto.customerPhone !== undefined) {
      order.customerPhone = dto.customerPhone.trim();
    }
    if (dto.customerRegion !== undefined) {
      order.customerRegion = dto.customerRegion.trim();
    }
    if (dto.customerDistrict !== undefined) {
      order.customerDistrict = dto.customerDistrict.trim();
    }
    if (dto.customerArea !== undefined) {
      order.customerArea = dto.customerArea.trim();
    }
    if (dto.customerAddress !== undefined) {
      order.customerAddress = dto.customerAddress.trim();
    }
    if (dto.comment !== undefined) {
      order.comment = dto.comment.trim();
    }

    const totals = this.computeTotals(order.items, order.payments);
    order.itemsCount = totals.itemsCount;
    order.subtotal = totals.subtotal;
    order.discountTotal = totals.discountTotal;
    order.total = totals.total;
    order.paidTotal = totals.paidTotal;
    order.remainingTotal = totals.remainingTotal;

    await order.save();
    return this.findById(id, scope);
  }

  async confirm(
    id: string,
    dto: UpdateOrderDto,
    scope?: UserWarehouseScope,
  ): Promise<OrderDocument> {
    const order = await this.update(id, dto, scope);
    this.ensureReadyForFulfillment(order);

    order.items = order.items.map((item) => ({
      ...item,
      fulfilled: false,
    }));
    order.status = 'pending_fulfillment';
    order.receiptPrintedAt = undefined;
    order.receiptSkipped = false;
    await order.save();
    return this.findById(id, scope);
  }

  async recordReceipt(
    id: string,
    dto: OrderReceiptDto,
    scope?: UserWarehouseScope,
  ): Promise<OrderDocument> {
    const order = await this.findById(id, scope);

    if (order.status !== 'pending_fulfillment') {
      throw new BadRequestException(
        'Chek faqat chiqim kutilayotgan buyurtmalar uchun',
      );
    }

    if (dto.action === 'print') {
      order.receiptPrintedAt = new Date();
      order.receiptSkipped = false;
    } else {
      order.receiptSkipped = true;
    }

    await order.save();
    return this.findById(id, scope);
  }

  async fulfill(
    id: string,
    dto: FulfillOrderDto,
    scope?: UserWarehouseScope,
  ): Promise<OrderDocument> {
    const order = await this.findById(id, scope);

    if (order.status !== 'pending_fulfillment') {
      throw new BadRequestException(
        'Faqat chiqim kutilayotgan buyurtmani tasdiqlash mumkin',
      );
    }

    if (dto.items.length !== order.items.length) {
      throw new BadRequestException('Barcha maxsulotlar belgilanishi kerak');
    }

    const fulfillmentByIndex = new Map(
      dto.items.map((item) => [item.index, item.fulfilled]),
    );

    for (let index = 0; index < order.items.length; index += 1) {
      if (!fulfillmentByIndex.get(index)) {
        throw new BadRequestException(
          'Barcha maxsulotlarni belgilab chiqing',
        );
      }
    }

    order.items = order.items.map((item, index) => ({
      ...item,
      fulfilled: fulfillmentByIndex.get(index) === true,
    }));

    await this.deductStockForFulfillment(order);

    order.status = 'confirmed';
    await order.save();
    await this.dailyBalancesService.recordOrderSale(order._id.toString());
    return this.findById(id, scope);
  }

  private async deductStockForFulfillment(order: OrderDocument): Promise<void> {
    const sourceName = `Buyurtma #${order._id.toString().slice(-6).toUpperCase()}`;

    for (const item of order.items) {
      let remaining = item.quantity;

      const stocks = await this.stockModel
        .find({
          productId: item.productId,
          quantity: { $gt: 0 },
        })
        .sort({ updatedAt: 1 })
        .exec();

      const totalAvailable = stocks.reduce(
        (sum, stock) => sum + stock.quantity,
        0,
      );

      if (totalAvailable < remaining) {
        throw new BadRequestException(
          `${item.productName} uchun omborda yetarli miqdor yo'q (mavjud: ${totalAvailable}, kerak: ${remaining})`,
        );
      }

      for (const stock of stocks) {
        if (remaining <= 0) break;

        const deduct = Math.min(stock.quantity, remaining);
        const updatedStock = await this.stockModel
          .findOneAndUpdate(
            {
              _id: stock._id,
              quantity: { $gte: deduct },
            },
            {
              $inc: { quantity: -deduct },
            },
            { new: true },
          )
          .exec();

        if (!updatedStock) {
          throw new BadRequestException(
            `${item.productName} uchun ombor qoldig'ini yangilab bo'lmadi`,
          );
        }

        await this.movementModel.create({
          warehouseId: stock.warehouseId,
          productId: item.productId,
          delta: -deduct,
          balanceAfter: updatedStock.quantity,
          sourceType: 'order_fulfillment',
          sourceId: order._id,
          sourceName,
          unitPrice: item.unitPrice,
          exchangeRate: stock.lastExchangeRate ?? 1,
          notes: item.productName,
        });

        remaining -= deduct;
      }
    }
  }

  private ensureReadyForFulfillment(order: OrderDocument) {
    if (!order.customerPhone?.trim()) {
      throw new BadRequestException('Mijoz telefon raqamini kiriting');
    }

    if (!order.items.length) {
      throw new BadRequestException('Kamida bitta maxsulot qo\'shing');
    }

    if (!order.payments.length) {
      throw new BadRequestException('Kamida bitta to\'lov qo\'shing');
    }

    this.ensurePaymentTotalValid(order.total, order.paidTotal);
  }

  async cancel(id: string, scope?: UserWarehouseScope): Promise<OrderDocument> {
    const order = await this.findById(id, scope);

    if (order.status !== 'draft' && order.status !== 'pending_fulfillment') {
      throw new BadRequestException(
        'Faqat qoralama yoki chiqim kutilayotgan buyurtmani bekor qilish mumkin',
      );
    }

    order.status = 'cancelled';
    await order.save();
    return this.findById(id, scope);
  }

  async findAll(query: OrderQueryDto, scope?: UserWarehouseScope) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;
    const filter = await this.buildListFilter(query, scope);

    if (!filter) {
      return {
        data: [],
        meta: emptyPaginatedMeta(page, perPage),
      };
    }

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    const createdByNames = await this.loadCreatedByNames(items);

    return {
      data: items.map((item) =>
        toOrderResponse(item, createdByNames.get(item.createdById?.toString() ?? '')),
      ),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findById(id: string, scope?: UserWarehouseScope): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
    await this.ensureOrderAccess(order, scope);
    return order;
  }

  async findByIdResponse(id: string, scope?: UserWarehouseScope) {
    const order = await this.findById(id, scope);
    const createdByName = order.createdById
      ? await this.loadCreatedByName(order.createdById.toString())
      : '';
    return toOrderResponse(order, createdByName);
  }

  private mapItems(items: OrderItemInput[]) {
    return items.map((item) => {
      const discount = item.discount ?? 0;
      const lineTotal =
        item.lineTotal ??
        Math.max(0, item.unitPrice * item.quantity - discount);

      return {
        productId: new Types.ObjectId(item.productId),
        productName: item.productName.trim(),
        productCode: item.productCode?.trim() ?? '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discount,
        lineTotal,
        fulfilled: false,
      };
    });
  }

  private mapPayments(payments: OrderPaymentInput[]) {
    return payments.map((payment) => ({
      paymentTypeId: new Types.ObjectId(payment.paymentTypeId),
      paymentTypeName: payment.paymentTypeName.trim(),
      amount: payment.amount,
      installmentMonths: payment.installmentMonths,
      installmentInterestPercent: payment.installmentInterestPercent,
    }));
  }

  private computeTotals(
    items: Array<{
      unitPrice: number;
      quantity: number;
      discount?: number;
      lineTotal: number;
    }>,
    payments: Array<{ amount: number }>,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const discountTotal = items.reduce(
      (sum, item) => sum + (item.discount ?? 0),
      0,
    );
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingTotal = Math.max(0, total - paidTotal);

    return {
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      paidTotal: Math.round(paidTotal * 100) / 100,
      remainingTotal: Math.round(remainingTotal * 100) / 100,
    };
  }

  private ensurePaymentTotalValid(total: number, paidTotal: number) {
    if (paidTotal > total + 0.01) {
      throw new BadRequestException(
        'To\'lovlar summasi buyurtma summasidan oshmasligi kerak',
      );
    }
  }

  private async buildListFilter(
    query: OrderQueryDto,
    scope?: UserWarehouseScope,
  ): Promise<Record<string, unknown> | null> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [];

    if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return null;
      }

      const legacyUserIds = await this.getUserIdsForWarehouses(scope.warehouseIds);
      and.push({
        $or: [
          { warehouseId: { $in: scope.warehouseIds } },
          {
            $and: [
              {
                $or: [
                  { warehouseId: { $exists: false } },
                  { warehouseId: null },
                ],
              },
              ...(legacyUserIds.length > 0
                ? [{ createdById: { $in: legacyUserIds } }]
                : [{ _id: { $exists: false } }]),
            ],
          },
        ],
      });
    }

    const idFilter = buildIdFilter(query.id);
    if (idFilter) and.push(idFilter);

    if (query.customerName?.trim()) {
      and.push({
        customerName: new RegExp(escapeRegex(query.customerName.trim()), 'i'),
      });
    }

    if (query.customerPhone?.trim()) {
      const phoneSearch = escapeRegex(query.customerPhone.trim());
      and.push({
        $or: [
          { customerPhone: new RegExp(phoneSearch, 'i') },
          {
            customerPhone: new RegExp(
              phoneSearch.replace(/^\+/, ''),
              'i',
            ),
          },
        ],
      });
    }

    if (query.subtotal !== undefined && !Number.isNaN(query.subtotal)) {
      and.push({
        subtotal: {
          $gte: query.subtotal - 0.01,
          $lte: query.subtotal + 0.01,
        },
      });
    }

    if (query.total !== undefined && !Number.isNaN(query.total)) {
      and.push({
        total: {
          $gte: query.total - 0.01,
          $lte: query.total + 0.01,
        },
      });
    }

    if (
      query.discountTotal !== undefined &&
      !Number.isNaN(query.discountTotal)
    ) {
      and.push({
        discountTotal: {
          $gte: query.discountTotal - 0.01,
          $lte: query.discountTotal + 0.01,
        },
      });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    if (query.createdByName?.trim()) {
      const nameRegex = new RegExp(escapeRegex(query.createdByName.trim()), 'i');
      const users = await this.userModel
        .find({
          $or: [{ firstName: nameRegex }, { lastName: nameRegex }],
        })
        .select('_id firstName lastName')
        .exec();

      const matchingUserIds = users
        .filter((user) =>
          nameRegex.test(`${user.firstName} ${user.lastName}`.trim()),
        )
        .map((user) => user._id);

      and.push({ createdById: { $in: matchingUserIds } });
    }

    const createdAtRange = parseCreatedAtFilter(query.createdAt);
    if (createdAtRange) {
      and.push({ createdAt: createdAtRange });
    }

    if (query.search?.trim()) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      and.push({
        $or: [
          { customerName: regex },
          { customerPhone: regex },
          { customerAddress: regex },
          { comment: regex },
        ],
      });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }

  private async loadCreatedByName(userId: string): Promise<string> {
    const user = await this.userModel
      .findById(userId)
      .select('firstName lastName')
      .exec();

    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async loadCreatedByNames(orders: OrderDocument[]) {
    const userIds = [
      ...new Set(
        orders
          .map((order) => order.createdById?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('firstName lastName')
      .exec();

    const map = new Map<string, string>();
    for (const user of users) {
      map.set(user._id.toString(), `${user.firstName} ${user.lastName}`.trim());
    }

    return map;
  }

  private async ensureProductsExist(productIds: string[]) {
    const uniqueIds = [...new Set(productIds)];
    const count = await this.productModel
      .countDocuments({ _id: { $in: uniqueIds } })
      .exec();

    if (count !== uniqueIds.length) {
      throw new BadRequestException('Ba\'zi maxsulotlar topilmadi');
    }
  }

  private async ensurePaymentTypesExist(paymentTypeIds: string[]) {
    if (paymentTypeIds.length === 0) return;

    const uniqueIds = [...new Set(paymentTypeIds)];
    const count = await this.paymentTypeModel
      .countDocuments({ _id: { $in: uniqueIds }, isActive: true })
      .exec();

    if (count !== uniqueIds.length) {
      throw new BadRequestException('Ba\'zi to\'lov turlari topilmadi');
    }
  }

  private async resolveWarehouseIdForUser(
    userId?: string,
    scope?: UserWarehouseScope,
  ): Promise<Types.ObjectId | undefined> {
    if (!userId) {
      return undefined;
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user?.warehouseIds?.length) {
      if (scope && !scope.allWarehouses) {
        throw new ForbiddenException(
          'Sizga filial biriktirilmagan. Administrator bilan bog\'laning',
        );
      }
      return undefined;
    }

    const primaryWarehouseId = user.warehouseIds[0];
    ensureWarehouseAllowed(scope, primaryWarehouseId);
    return primaryWarehouseId;
  }

  private async ensureOrderAccess(
    order: OrderDocument,
    scope?: UserWarehouseScope,
  ): Promise<void> {
    if (!scope || scope.allWarehouses) {
      return;
    }

    if (order.warehouseId) {
      ensureWarehouseAllowed(scope, order.warehouseId);
      return;
    }

    if (!order.createdById) {
      throw new ForbiddenException('Bu buyurtmaga ruxsatingiz yo\'q');
    }

    const user = await this.userModel.findById(order.createdById).exec();
    const hasAccess = user?.warehouseIds?.some((warehouseId) =>
      scope.warehouseIds.some(
        (allowedId) => allowedId.toString() === warehouseId.toString(),
      ),
    );

    if (!hasAccess) {
      throw new ForbiddenException('Bu buyurtmaga ruxsatingiz yo\'q');
    }
  }

  private async getUserIdsForWarehouses(
    warehouseIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    const users = await this.userModel
      .find({ warehouseIds: { $in: warehouseIds } })
      .select('_id')
      .exec();

    return users.map((user) => user._id);
  }
}
