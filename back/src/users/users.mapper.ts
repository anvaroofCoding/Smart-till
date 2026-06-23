import { Model, Types } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { UserResponseDto } from './dto/user.dto';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';

export async function toUserResponse(
  user: UserDocument,
  warehouseModel?: Model<WarehouseDocument>,
): Promise<UserResponseDto> {
  const birthDate = user.birthDate
    ? new Date(user.birthDate).toISOString().slice(0, 10)
    : undefined;

  const warehouseIds = (user.warehouseIds ?? []).map((id) => id.toString());
  let warehouses: Array<{ id: string; name: string }> = [];

  if (warehouseModel && warehouseIds.length > 0) {
    const rows = await warehouseModel
      .find({ _id: { $in: user.warehouseIds } })
      .select('name')
      .sort({ name: 1 })
      .exec();
    warehouses = rows.map((row) => ({
      id: row._id.toString(),
      name: row.name,
    }));
  }

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    login: user.login,
    email: user.email,
    phone: user.phone ?? '',
    age: user.age ?? 0,
    birthDate,
    position: user.position,
    allowedPages: user.allowedPages ?? [],
    allWarehouses: Boolean(user.allWarehouses) || user.position === 'admin',
    warehouseIds,
    warehouses,
    avatar: user.avatar ?? '',
    isActive: user.isActive,
    createdAt: (user as UserDocument & { createdAt: Date }).createdAt,
    updatedAt: (user as UserDocument & { updatedAt: Date }).updatedAt,
  };
}

export async function toUserResponses(
  users: UserDocument[],
  warehouseModel?: Model<WarehouseDocument>,
): Promise<UserResponseDto[]> {
  if (!warehouseModel || users.length === 0) {
    return Promise.all(users.map((user) => toUserResponse(user)));
  }

  const allIds = [
    ...new Set(
      users.flatMap((user) =>
        (user.warehouseIds ?? []).map((id) => id.toString()),
      ),
    ),
  ];

  const warehouseRows =
    allIds.length > 0
      ? await warehouseModel
          .find({ _id: { $in: allIds.map((id) => new Types.ObjectId(id)) } })
          .select('name')
          .exec()
      : [];

  const warehouseMap = new Map(
    warehouseRows.map((row) => [row._id.toString(), row.name]),
  );

  return users.map((user) => {
    const birthDate = user.birthDate
      ? new Date(user.birthDate).toISOString().slice(0, 10)
      : undefined;
    const warehouseIds = (user.warehouseIds ?? []).map((id) => id.toString());

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      login: user.login,
      email: user.email,
      phone: user.phone ?? '',
      age: user.age ?? 0,
      birthDate,
      position: user.position,
      allowedPages: user.allowedPages ?? [],
      allWarehouses: Boolean(user.allWarehouses) || user.position === 'admin',
      warehouseIds,
      warehouses: warehouseIds
        .map((id) => ({
          id,
          name: warehouseMap.get(id) ?? '—',
        }))
        .filter((item) => item.name !== '—' || warehouseIds.includes(item.id)),
      avatar: user.avatar ?? '',
      isActive: user.isActive,
      createdAt: (user as UserDocument & { createdAt: Date }).createdAt,
      updatedAt: (user as UserDocument & { updatedAt: Date }).updatedAt,
    };
  });
}
