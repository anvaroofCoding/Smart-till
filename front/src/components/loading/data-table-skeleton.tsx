import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableSkeletonProps {
  columns: number
  rows?: number
  headers?: string[]
  showToolbar?: boolean
  className?: string
}

const DEFAULT_CELL_WIDTHS = ['w-8', 'w-32', 'w-24', 'w-28', 'w-20', 'w-24', 'w-16', 'w-20', 'w-28']

export function DataTableSkeleton({
  columns,
  rows = 5,
  headers,
  showToolbar = false,
  className,
}: DataTableSkeletonProps) {
  const cellWidths = DEFAULT_CELL_WIDTHS.slice(0, columns)

  return (
    <div className={cn('flex flex-col gap-4', className)} aria-busy aria-label="Jadval yuklanmoqda">
      {showToolbar && <Skeleton className="h-10 w-full max-w-md" />}

      <Table>
        <TableHeader>
          <TableRow>
            {headers?.length
              ? headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))
              : Array.from({ length: columns }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((__, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton
                    className={cn(
                      'h-4',
                      cellWidths[cellIndex] ?? 'w-full',
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
