import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getDisplayRange,
  getVisiblePages,
  PER_PAGE_OPTIONS,
  type PerPageOption,
} from '@/lib/pagination'
import { cn } from '@/lib/utils'
import type { PaginatedMeta } from '@/types/api.types'

interface DataTablePaginationProps {
  meta: PaginatedMeta
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: PerPageOption) => void
  disabled?: boolean
  className?: string
}

export function DataTablePagination({
  meta,
  onPageChange,
  onPerPageChange,
  disabled = false,
  className,
}: DataTablePaginationProps) {
  const { from, to } = getDisplayRange(meta)
  const visiblePages = getVisiblePages(meta.page, meta.totalPages)
  const canGoPrevious = meta.page > 1
  const canGoNext = meta.page < meta.totalPages

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">
        {meta.total === 0 ? (
          'Natijalar topilmadi'
        ) : (
          <>
            <span className="text-foreground font-medium tabular-nums">
              {from}–{to}
            </span>
            {' '}
            ko&apos;rsatilmoqda, jami{' '}
            <span className="text-foreground font-medium tabular-nums">
              {meta.total}
            </span>
            {' '}
            ta
          </>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            Sahifada
          </span>
          <Select
            value={String(meta.perPage)}
            onValueChange={(value) =>
              onPerPageChange(Number(value) as PerPageOption)
            }
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[72px]" aria-label="Sahifadagi qatorlar soni">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={disabled || !canGoPrevious}
                onClick={() => onPageChange(meta.page - 1)}
              />
            </PaginationItem>

            {visiblePages.map((page, index) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === meta.page}
                    disabled={disabled}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                disabled={disabled || !canGoNext}
                onClick={() => onPageChange(meta.page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
