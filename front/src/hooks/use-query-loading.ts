interface QueryLoadingState {
  isLoading: boolean
  isFetching: boolean
  isUninitialized?: boolean
}

/**
 * RTK Query / TanStack Query uchun yagona loading holati.
 * showSkeleton — birinchi yuklash (skeleton ko'rsatiladi)
 * showRefreshing — fon yangilanishi (kontent qoladi, indikator chiqadi)
 */
export function useQueryLoading({
  isLoading,
  isFetching,
  isUninitialized = false,
}: QueryLoadingState) {
  const showSkeleton = isLoading || isUninitialized
  const showRefreshing = isFetching && !showSkeleton

  return {
    showSkeleton,
    showRefreshing,
    isLoading,
    isFetching,
  }
}

export function useQueriesLoading(queries: QueryLoadingState[]) {
  const showSkeleton = queries.some(
    (query) => query.isLoading || query.isUninitialized,
  )
  const showRefreshing =
    queries.some((query) => query.isFetching) && !showSkeleton

  return {
    showSkeleton,
    showRefreshing,
  }
}
