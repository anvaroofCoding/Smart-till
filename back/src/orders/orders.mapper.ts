import { OrderResponseDto } from './dto/order.dto';
import { OrderDocument } from './schemas/order.schema';

export function toOrderResponse(
  order: OrderDocument,
  createdByName = '',
): OrderResponseDto {
  return {
    id: order._id.toString(),
    customerName: order.customerName ?? '',
    customerPhone: order.customerPhone,
    customerRegion: order.customerRegion ?? '',
    customerDistrict: order.customerDistrict ?? '',
    customerArea: order.customerArea ?? '',
    customerAddress: order.customerAddress ?? '',
    comment: order.comment ?? '',
    items: (order.items ?? []).map((item) => ({
      productId: item.productId.toString(),
      productName: item.productName,
      productCode: item.productCode ?? '',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discount: item.discount ?? 0,
      lineTotal: item.lineTotal,
      fulfilled: item.fulfilled ?? false,
    })),
    payments: (order.payments ?? []).map((payment) => ({
      paymentTypeId: payment.paymentTypeId.toString(),
      paymentTypeName: payment.paymentTypeName,
      amount: payment.amount,
      installmentMonths: payment.installmentMonths,
      installmentInterestPercent: payment.installmentInterestPercent,
    })),
    itemsCount: order.itemsCount ?? 0,
    subtotal: order.subtotal ?? 0,
    discountTotal: order.discountTotal ?? 0,
    total: order.total ?? 0,
    paidTotal: order.paidTotal ?? 0,
    remainingTotal: order.remainingTotal ?? 0,
    status: order.status,
    receiptPrintedAt: order.receiptPrintedAt,
    receiptSkipped: order.receiptSkipped ?? false,
    createdByName,
    createdAt: (order as OrderDocument & { createdAt: Date }).createdAt,
    updatedAt: (order as OrderDocument & { updatedAt: Date }).updatedAt,
  };
}
