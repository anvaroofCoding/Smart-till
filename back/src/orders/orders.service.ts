import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { escapeRegex } from '../common/utils/list-filter.utils';
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
  UpdateOrderDto,
} from './dto/order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { toOrderResponse } from './orders.mapper';
import { Order, OrderDocument } from './schemas/order.schema';

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
  ) {}

  async createDraft(
    dto: CreateDraftOrderDto,
    userId?: string,
  ): Promise<OrderDocument> {
    await this.ensureProductsExist(dto.items.map((item) => item.productId));

    const items = this.mapItems(dto.items);
    const totals = this.computeTotals(items, []);

    const order = await this.orderModel.create({
      items,
      payments: [],
      ...totals,
      status: 'draft',
      ...(userId ? { createdById: new Types.ObjectId(userId) } : {}),
    });

    return this.findById(order._id.toString());
  }

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderDocument> {
    await this.ensureProductsExist(dto.items.map((item) => item.productId));
    await this.ensurePaymentTypesExist(
      dto.payments.map((payment) => payment.paymentTypeId),
    );

    const items = this.mapItems(dto.items);
    const payments = this.mapPayments(dto.payments);
    const totals = this.computeTotals(items, payments);
    this.ensurePaymentTotalValid(totals.total, totals.paidTotal);

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
    });

    return this.findById(order._id.toString());
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderDocument> {
    const order = await this.findById(id);

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
    return this.findById(id);
  }

  async confirm(id: string, dto: UpdateOrderDto): Promise<OrderDocument> {
    const order = await this.update(id, dto);

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

    order.status = 'confirmed';
    await order.save();
    return this.findById(id);
  }

  async findAll(query: OrderQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const filter = this.buildListFilter(query);

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

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
    return order;
  }

  async findByIdResponse(id: string) {
    const order = await this.findById(id);
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

  private buildListFilter(query: OrderQueryDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { customerName: regex },
        { customerPhone: regex },
        { customerAddress: regex },
        { comment: regex },
      ];
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
}
