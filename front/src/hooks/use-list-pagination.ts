import { useEffect, useState } from 'react'

import {
  DEFAULT_PER_PAGE,
  type PerPageOption,
} from '@/lib/pagination'

export function useListPagination(search: string) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<PerPageOption>(DEFAULT_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [search, perPage])

  function handlePerPageChange(nextPerPage: PerPageOption) {
    setPerPage(nextPerPage)
    setPage(1)
  }

  return {
    page,
    perPage,
    setPage,
    setPerPage: handlePerPageChange,
  }
}
