import { WarehouseDocument } from './schemas/warehouse.schema';
import { WarehouseResponseDto } from './dto/warehouse.dto';

export function toWarehouseResponse(
  warehouse: WarehouseDocument,
): WarehouseResponseDto {
  return {
    id: warehouse._id.toString(),
    name: warehouse.name,
    address: warehouse.address ?? '',
    description: warehouse.description ?? '',
    isActive: warehouse.isActive,
    createdAt: (warehouse as WarehouseDocument & { createdAt: Date }).createdAt,
    updatedAt: (warehouse as WarehouseDocument & { updatedAt: Date }).updatedAt,
  };
}
