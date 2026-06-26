export function resolveSenderWarehouseId(
  warehouseIds: string[],
  availableWarehouses: Array<{ id: string }>,
  allWarehouses: boolean,
): string {
  if (warehouseIds.length === 1) {
    return warehouseIds[0]
  }

  if (availableWarehouses.length === 1) {
    return availableWarehouses[0].id
  }

  const matchedAssigned = availableWarehouses.find((warehouse) =>
    warehouseIds.includes(warehouse.id),
  )
  if (matchedAssigned) return matchedAssigned.id

  if (warehouseIds.length > 0) {
    return warehouseIds[0]
  }

  if (allWarehouses && availableWarehouses.length > 0) {
    return availableWarehouses[0].id
  }

  return ''
}
