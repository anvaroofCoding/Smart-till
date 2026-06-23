import { ProductBrandDocument } from './schemas/product-brand.schema';
import { ProductBrandResponseDto } from './dto/product-brand.dto';

export function toProductBrandResponse(
  brand: ProductBrandDocument,
): ProductBrandResponseDto {
  return {
    id: brand._id.toString(),
    name: brand.name,
    description: brand.description ?? '',
    isActive: brand.isActive,
    createdAt: (brand as ProductBrandDocument & { createdAt: Date }).createdAt,
    updatedAt: (brand as ProductBrandDocument & { updatedAt: Date }).updatedAt,
  };
}
