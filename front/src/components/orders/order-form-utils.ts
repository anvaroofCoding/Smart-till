import { createLineId, createPaymentId, getLineTotal } from '@/components/orders/order-create-utils'
import { parseUzbekPhoneLocal } from '@/lib/phone'
import type {
  CreateOrderItemRequest,
  OrderCustomerInfo,
  OrderLineItem,
  OrderPaymentLine,
  OrderRecord,
  UpdateOrderRequest,
} from '@/types/order.types'

export const emptyCustomer: OrderCustomerInfo = {
  name: '',
  phone: '',
  region: '',
  district: '',
  area: '',
  address: '',
  comment: '',
}

export function orderRecordToFormState(order: OrderRecord) {
  return {
    customer: {
      name: order.customerName,
      phone: parseUzbekPhoneLocal(order.customerPhone),
      region: order.customerRegion,
      district: order.customerDistrict,
      area: order.customerArea,
      address: order.customerAddress,
      comment: order.comment,
    },
    items: order.items.map((item) => ({
      id: createLineId(),
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discount: item.discount,
    })),
    payments: order.payments.map((payment) => ({
      id: createPaymentId(),
      paymentTypeId: payment.paymentTypeId,
      paymentTypeName: payment.paymentTypeName,
      amount: payment.amount,
      installmentMonths: payment.installmentMonths,
      installmentInterestPercent: payment.installmentInterestPercent,
    })),
  }
}

export function buildOrderItemsPayload(items: OrderLineItem[]): CreateOrderItemRequest[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    productCode: item.productCode,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    discount: item.discount,
    lineTotal: getLineTotal(item),
  }))
}

export function buildOrderUpdatePayload(
  customer: OrderCustomerInfo,
  items: OrderLineItem[],
  payments: OrderPaymentLine[],
  phone?: string,
): UpdateOrderRequest {
  return {
    customerName: customer.name.trim() || undefined,
    customerPhone: phone,
    customerRegion: customer.region.trim() || undefined,
    customerDistrict: customer.district.trim() || undefined,
    customerArea: customer.area.trim() || undefined,
    customerAddress: customer.address.trim() || undefined,
    comment: customer.comment.trim() || undefined,
    items: buildOrderItemsPayload(items),
    payments: payments.map((payment) => ({
      paymentTypeId: payment.paymentTypeId,
      paymentTypeName: payment.paymentTypeName,
      amount: payment.amount,
      installmentMonths: payment.installmentMonths,
      installmentInterestPercent: payment.installmentInterestPercent,
    })),
  }
}
