import { ProductCategoryDocument } from './schemas/product-category.schema';
import { ProductCategoryResponseDto } from './dto/product-category.dto';

export function toProductCategoryResponse(
  category: ProductCategoryDocument,
  productsCount = 0,
): ProductCategoryResponseDto {
  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description ?? '',
    isActive: category.isActive,
    productsCount,
    createdAt: (category as ProductCategoryDocument & { createdAt: Date })
      .createdAt,
    updatedAt: (category as ProductCategoryDocument & { updatedAt: Date })
      .updatedAt,
  };
}
