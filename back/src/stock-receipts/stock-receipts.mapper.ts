import { Types } from 'mongoose';
import { StockReceiptResponseDto } from './dto/stock-receipt.dto';
import { StockReceiptDocument } from './schemas/stock-receipt.schema';

type PopulatedRelation =
  | Types.ObjectId
  | { _id: Types.ObjectId; name: string };

function resolveRelation(
  value: PopulatedRelation,
  fallbackId?: Types.ObjectId,
): { id: string; name: string } {
  if (value && typeof value === 'object' && 'name' in value) {
    return {
      id: value._id.toString(),
      name: value.name,
    };
  }

  const id = (value as Types.ObjectId)?.toString() ?? fallbackId?.toString() ?? '';
  return { id, name: '' };
}

export function toStockReceiptResponse(
  receipt: StockReceiptDocument,
): StockReceiptResponseDto {
  const items = (receipt.items ?? []).map((item) => {
    const quantity = item.quantity ?? 0;
    const unitPrice = item.unitPrice ?? 0;
    const subdoc = item as typeof item & { _id?: Types.ObjectId };

    return {
      id: subdoc._id?.toString() ?? '',
      productId: item.productId.toString(),
      productName: item.productName,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: receipt._id.toString(),
    name: receipt.name,
    paymentType: receipt.paymentType,
    supplier: resolveRelation(
      receipt.supplierId as PopulatedRelation,
      receipt.supplierId as Types.ObjectId,
    ),
    warehouse: resolveRelation(
      receipt.warehouseId as PopulatedRelation,
      receipt.warehouseId as Types.ObjectId,
    ),
    exchangeRate: receipt.exchangeRate,
    notes: receipt.notes ?? '',
    status: receipt.status,
    items,
    itemsCount: items.length,
    totalAmount,
    createdAt: (receipt as StockReceiptDocument & { createdAt: Date }).createdAt,
    updatedAt: (receipt as StockReceiptDocument & { updatedAt: Date }).updatedAt,
  };
}
