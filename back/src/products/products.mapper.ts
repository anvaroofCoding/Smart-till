import { Types } from 'mongoose';
import { ProductResponseDto } from './dto/product.dto';
import { ProductDocument } from './schemas/product.schema';

function resolveRelation(
  value: Types.ObjectId | { _id: Types.ObjectId; name: string },
  fallbackId: Types.ObjectId,
) {
  if (value && typeof value === 'object' && 'name' in value) {
    return {
      id: value._id.toString(),
      name: value.name,
    };
  }

  return {
    id: fallbackId.toString(),
    name: '',
  };
}

export function toProductResponse(product: ProductDocument): ProductResponseDto {
  return {
    id: product._id.toString(),
    name: product.name,
    category: resolveRelation(
      product.categoryId as Types.ObjectId | { _id: Types.ObjectId; name: string },
      product.categoryId as Types.ObjectId,
    ),
    brand: resolveRelation(
      product.brandId as Types.ObjectId | { _id: Types.ObjectId; name: string },
      product.brandId as Types.ObjectId,
    ),
    image: product.image ?? '',
    isActive: product.isActive,
    createdAt: (product as ProductDocument & { createdAt: Date }).createdAt,
    updatedAt: (product as ProductDocument & { updatedAt: Date }).updatedAt,
  };
}
