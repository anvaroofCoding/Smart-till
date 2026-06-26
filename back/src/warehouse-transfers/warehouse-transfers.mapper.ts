import { Types } from 'mongoose';
import { WarehouseTransferResponseDto } from './dto/warehouse-transfer.dto';
import { WarehouseTransferDocument } from './schemas/warehouse-transfer.schema';

type PopulatedWarehouse =
  | Types.ObjectId
  | { _id: Types.ObjectId; name: string };

function resolveWarehouse(
  value: PopulatedWarehouse,
  fallbackName = '',
): { id: string; name: string } {
  if (value && typeof value === 'object' && 'name' in value) {
    return {
      id: value._id.toString(),
      name: value.name,
    };
  }

  return {
    id: (value as Types.ObjectId).toString(),
    name: fallbackName,
  };
}

export function toWarehouseTransferResponse(
  transfer: WarehouseTransferDocument,
  fromWarehouseName = '',
  toWarehouseName = '',
  productBarcodesMap: Map<string, string[]> = new Map(),
): WarehouseTransferResponseDto {
  const fromWarehouse = resolveWarehouse(
    transfer.fromWarehouseId as PopulatedWarehouse,
    fromWarehouseName,
  );
  const toWarehouse = transfer.toWarehouseId
    ? resolveWarehouse(
        transfer.toWarehouseId as PopulatedWarehouse,
        toWarehouseName,
      )
    : { id: '', name: '' };

  return {
    id: transfer._id.toString(),
    code: transfer.code,
    name: transfer.name ?? '',
    fromWarehouseId: fromWarehouse.id,
    fromWarehouseName: fromWarehouse.name,
    toWarehouseId: toWarehouse.id,
    toWarehouseName: toWarehouse.name,
    transferDate: transfer.transferDate,
    status: transfer.status,
    items: transfer.items.map((item) => {
      const productRef = item.productId as
        | Types.ObjectId
        | { _id: Types.ObjectId; barcode?: string };

      const productId =
        productRef && typeof productRef === 'object' && '_id' in productRef
          ? productRef._id.toString()
          : (productRef as Types.ObjectId).toString();

      const productBarcode =
        productRef &&
        typeof productRef === 'object' &&
        'barcode' in productRef &&
        typeof productRef.barcode === 'string'
          ? productRef.barcode
          : '';

      const productBarcodes =
        productBarcodesMap.get(productId) ??
        (productBarcode ? [productBarcode] : []);

      return {
        id:
          (item as typeof item & { _id?: Types.ObjectId })._id?.toString() ??
          '',
        productId,
        productName: item.productName,
        productBarcode: productBarcodes[0] ?? productBarcode,
        productBarcodes,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        receivedQuantity: item.receivedQuantity,
        receivedMarked: item.receivedMarked ?? false,
      };
    }),
    notes: transfer.notes ?? '',
    sentAt: transfer.sentAt,
    completedAt: transfer.completedAt,
    createdAt: (transfer as WarehouseTransferDocument & { createdAt: Date })
      .createdAt,
    updatedAt: (transfer as WarehouseTransferDocument & { updatedAt: Date })
      .updatedAt,
  };
}
