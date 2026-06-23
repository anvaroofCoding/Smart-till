import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatsCardsSkeletonProps {
  count?: number
  className?: string
}

export function StatsCardsSkeleton({
  count = 4,
  className,
}: StatsCardsSkeletonProps) {
  return (
    <div
      className={cn(
        'grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
      aria-busy
      aria-label="Statistika yuklanmoqda"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardDescription>
              <Skeleton className="h-4 w-32" />
            </CardDescription>
            <CardTitle>
              <Skeleton className="h-8 w-16" />
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
