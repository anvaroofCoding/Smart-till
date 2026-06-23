import { SupplierResponseDto } from './dto/supplier.dto';
import { SupplierDocument } from './schemas/supplier.schema';

export function toSupplierResponse(
  supplier: SupplierDocument,
): SupplierResponseDto {
  return {
    id: supplier._id.toString(),
    name: supplier.name,
    officialName: supplier.officialName ?? '',
    phone: supplier.phone ?? '',
    address: supplier.address ?? '',
    comment: supplier.comment ?? '',
    currency: supplier.currency,
    isActive: supplier.isActive,
    createdAt: (supplier as SupplierDocument & { createdAt: Date }).createdAt,
    updatedAt: (supplier as SupplierDocument & { updatedAt: Date }).updatedAt,
  };
}
