import { Types } from 'mongoose';
import {
  StockMovementResponseDto,
  WarehouseStockDetailDto,
  WarehouseStockListItemDto,
} from './dto/warehouse-stock.dto';
import { StockMovementDocument } from '../stock-movements/schemas/stock-movement.schema';
import { WarehouseStockDocument } from './schemas/warehouse-stock.schema';
import type { ResolvedSellingPrice } from '../price-settings/utils/resolve-selling-price';

type PopulatedRelation =
  | Types.ObjectId
  | { _id: Types.ObjectId; name: string };

type PopulatedProduct =
  | Types.ObjectId
  | {
      _id: Types.ObjectId;
      name: string;
      code: string;
      barcode?: string;
      categoryId: PopulatedRelation;
      brandId: PopulatedRelation;
    };

const PRICE_EPSILON = 0.009;

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

  const id =
    (value as Types.ObjectId)?.toString() ?? fallbackId?.toString() ?? '';
  return { id, name: '' };
}

function resolveProduct(
  product: PopulatedProduct,
  barcodes: string[] = [],
): WarehouseStockListItemDto['product'] {
  if (!product || typeof product !== 'object' || !('name' in product)) {
    const id = (product as Types.ObjectId)?.toString() ?? '';
    return {
      id,
      name: '',
      code: '',
      barcode: '',
      barcodes: [],
      category: { id: '', name: '' },
      brand: { id: '', name: '' },
    };
  }

  const primaryBarcode = product.barcode?.trim() || barcodes[0] || '';
  const allBarcodes =
    barcodes.length > 0
      ? barcodes
      : primaryBarcode
        ? [primaryBarcode]
        : [];

  return {
    id: product._id.toString(),
    name: product.name,
    code: product.code ?? '',
    barcode: primaryBarcode,
    barcodes: allBarcodes,
    category: resolveRelation(
      product.categoryId as PopulatedRelation,
      product.categoryId as Types.ObjectId,
    ),
    brand: resolveRelation(
      product.brandId as PopulatedRelation,
      product.brandId as Types.ObjectId,
    ),
  };
}

function resolveStockPricing(
  stock: WarehouseStockDocument,
  latestMovement?: StockMovementDocument | null,
) {
  const unitPrice =
    latestMovement?.unitPrice ?? stock.lastUnitPrice ?? 0;
  const exchangeRate =
    latestMovement?.exchangeRate ?? stock.lastExchangeRate ?? 1;
  const quantity = stock.quantity ?? 0;

  return {
    unitPrice,
    exchangeRate,
    quantity,
    totalValue: quantity * unitPrice,
  };
}

export function analyzeUnitPrices(movements: StockMovementDocument[]) {
  if (movements.length === 0) {
    return { hasMixedUnitPrices: false, previousUnitPrices: [] as number[] };
  }

  const latestPrice = movements[0].unitPrice ?? 0;
  const uniquePrices = [
    ...new Set(
      movements
        .map((movement) => movement.unitPrice ?? 0)
        .filter((price) => price > 0),
    ),
  ];
  const previousUnitPrices = uniquePrices
    .filter((price) => Math.abs(price - latestPrice) > PRICE_EPSILON)
    .sort((left, right) => right - left);

  return {
    hasMixedUnitPrices: previousUnitPrices.length > 0,
    previousUnitPrices,
  };
}

export function toWarehouseStockListItem(
  stock: WarehouseStockDocument,
  latestMovement?: StockMovementDocument | null,
  sellingPrice?: ResolvedSellingPrice,
  productBarcodes: string[] = [],
): WarehouseStockListItemDto {
  const pricing = resolveStockPricing(stock, latestMovement);
  const resolvedSellingPrice = sellingPrice ?? {
    sellingPrice: pricing.unitPrice,
    priceSource: 'none' as const,
  };

  return {
    id: stock._id.toString(),
    product: resolveProduct(stock.productId as PopulatedProduct, productBarcodes),
    warehouse: resolveRelation(
      stock.warehouseId as PopulatedRelation,
      stock.warehouseId as Types.ObjectId,
    ),
    quantity: pricing.quantity,
    unitPrice: pricing.unitPrice,
    exchangeRate: pricing.exchangeRate,
    totalValue: pricing.totalValue,
    sellingPrice: resolvedSellingPrice.sellingPrice,
    markupPercent: resolvedSellingPrice.markupPercent,
    updatedAt: (stock as WarehouseStockDocument & { updatedAt: Date }).updatedAt,
  };
}

export function toStockMovementResponse(
  movement: StockMovementDocument,
): StockMovementResponseDto {
  const delta = movement.delta ?? 0;
  const unitPrice = movement.unitPrice ?? 0;
  const exchangeRate = movement.exchangeRate ?? 1;

  return {
    id: movement._id.toString(),
    sourceType: movement.sourceType,
    sourceName: movement.sourceName,
    sourceId: movement.sourceId?.toString(),
    supplier: resolveRelation(
      movement.supplierId as PopulatedRelation,
      movement.supplierId as Types.ObjectId,
    ),
    warehouse: resolveRelation(
      movement.warehouseId as PopulatedRelation,
      movement.warehouseId as Types.ObjectId,
    ),
    delta,
    balanceAfter: movement.balanceAfter ?? 0,
    unitPrice,
    exchangeRate,
    totalPrice: Math.abs(delta) * unitPrice,
    notes: movement.notes ?? '',
    createdAt: (movement as StockMovementDocument & { createdAt: Date }).createdAt,
  };
}

export function toWarehouseStockDetail(
  stock: WarehouseStockDocument,
  movements: StockMovementDocument[],
  sellingPrice?: ResolvedSellingPrice,
  productBarcodes: string[] = [],
): WarehouseStockDetailDto {
  const latestMovement = movements[0] ?? null;
  const priceAnalysis = analyzeUnitPrices(movements);

  return {
    ...toWarehouseStockListItem(
      stock,
      latestMovement,
      sellingPrice,
      productBarcodes,
    ),
    movements: movements.map((movement) => toStockMovementResponse(movement)),
    hasMixedUnitPrices: priceAnalysis.hasMixedUnitPrices,
    previousUnitPrices: priceAnalysis.previousUnitPrices,
  };
}

export function buildLatestMovementKey(
  warehouseId: Types.ObjectId | string,
  productId: Types.ObjectId | string,
): string {
  return `${warehouseId.toString()}:${productId.toString()}`;
}
