import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  PaymentType,
  PaymentTypeDocument,
} from '../payment-types/schemas/payment-type.schema';
import { CreateOrderDto } from './dto/order.dto';
import { toOrderResponse } from './orders.mapper';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(PaymentType.name)
    private readonly paymentTypeModel: Model<PaymentTypeDocument>,
  ) {}

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderDocument> {
    await this.ensureProductsExist(dto.items.map((item) => item.productId));
    await this.ensurePaymentTypesExist(
      dto.payments.map((payment) => payment.paymentTypeId),
    );

    const items = dto.items.map((item) => {
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

    const payments = dto.payments.map((payment) => ({
      paymentTypeId: new Types.ObjectId(payment.paymentTypeId),
      paymentTypeName: payment.paymentTypeName.trim(),
      amount: payment.amount,
      installmentMonths: payment.installmentMonths,
      installmentInterestPercent: payment.installmentInterestPercent,
    }));

    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingTotal = Math.max(0, total - paidTotal);

    if (paidTotal > total + 0.01) {
      throw new BadRequestException(
        'To\'lovlar summasi buyurtma summasidan oshmasligi kerak',
      );
    }

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
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      paidTotal: Math.round(paidTotal * 100) / 100,
      remainingTotal: Math.round(remainingTotal * 100) / 100,
      status: 'confirmed',
      ...(userId ? { createdById: new Types.ObjectId(userId) } : {}),
    });

    return this.findById(order._id.toString());
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
    return toOrderResponse(order);
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
    const uniqueIds = [...new Set(paymentTypeIds)];
    const count = await this.paymentTypeModel
      .countDocuments({ _id: { $in: uniqueIds }, isActive: true })
      .exec();

    if (count !== uniqueIds.length) {
      throw new BadRequestException('Ba\'zi to\'lov turlari topilmadi');
    }
  }
}
