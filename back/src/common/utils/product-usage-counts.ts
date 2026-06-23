import { Model, Types } from 'mongoose';
import { ProductDocument } from '../../products/schemas/product.schema';

export async function getProductCountsByField(
  productModel: Model<ProductDocument>,
  field: 'categoryId' | 'brandId',
  ids: Types.ObjectId[],
): Promise<Map<string, number>> {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await productModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}
