import { SellerCartResponseDto } from './dto/seller-cart.dto';
import { SellerCartDocument } from './schemas/seller-cart.schema';

export function toSellerCartResponse(
  cart: SellerCartDocument,
  sellerName?: string,
): SellerCartResponseDto {
  const items = (cart.items ?? []).map((item) => ({
    productId: item.productId.toString(),
    productName: item.productName,
    productCode: item.productCode ?? '',
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cart._id.toString(),
    cardNumber: cart.cardNumber,
    sellerId: cart.sellerId.toString(),
    sellerName,
    warehouseId: cart.warehouseId?.toString(),
    items,
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    status: cart.status,
    claimedOrderId: cart.claimedOrderId?.toString(),
    createdAt: (cart as SellerCartDocument & { createdAt: Date }).createdAt,
    updatedAt: (cart as SellerCartDocument & { updatedAt: Date }).updatedAt,
  };
}
