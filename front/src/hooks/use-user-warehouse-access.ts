import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  canAccessWarehouse,
  filterWarehousesForUser,
  getUserWarehouseLabel,
  userHasAllWarehouses,
} from '@/lib/user-warehouse'
import { useGetMeQuery } from '@/store/api'
import { selectCurrentUser, selectIsAuthenticated } from '@/store/slices/auth.slice'

export function useUserWarehouseAccess() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const storedUser = useSelector(selectCurrentUser)
  const meQuery = useGetMeQuery(undefined, { skip: !isAuthenticated })
  const user = meQuery.data?.user ?? storedUser

  return useMemo(
    () => ({
      user,
      isLoading: meQuery.isLoading || meQuery.isFetching,
      allWarehouses: userHasAllWarehouses(user),
      warehouseIds: user?.warehouseIds ?? [],
      warehouses: user?.warehouses ?? [],
      label: getUserWarehouseLabel(user),
      canAccessWarehouse: (warehouseId: string) =>
        canAccessWarehouse(user, warehouseId),
      filterWarehouses: <T extends { id: string }>(items: T[]) =>
        filterWarehousesForUser(items, user),
    }),
    [meQuery.isFetching, meQuery.isLoading, user],
  )
}