import type { PaginatedMeta } from '@/types/api.types'

export const DEFAULT_PER_PAGE = 100

export const PER_PAGE_OPTIONS = [10, 20, 50, 100] as const

export type PerPageOption = (typeof PER_PAGE_OPTIONS)[number]

export function getDisplayRange(meta: PaginatedMeta) {
  if (meta.total === 0) {
    return { from: 0, to: 0 }
  }

  const from = (meta.page - 1) * meta.perPage + 1
  const to = Math.min(meta.page * meta.perPage, meta.total)

  return { from, to }
}

export function getVisiblePages(
  currentPage: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)

  return pages
}
