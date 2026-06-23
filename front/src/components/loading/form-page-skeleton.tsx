import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface FormPageSkeletonProps {
  showBackButton?: boolean
  sections?: number
  fieldsPerSection?: number
  className?: string
}

export function FormPageSkeleton({
  showBackButton = true,
  sections = 2,
  fieldsPerSection = 4,
  className,
}: FormPageSkeletonProps) {
  return (
    <div
      className={cn('flex h-full min-h-0 w-full flex-col gap-4', className)}
      aria-busy
      aria-label="Forma yuklanmoqda"
    >
      <div className="space-y-2">
        {showBackButton && <Skeleton className="h-9 w-24" />}
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: fieldsPerSection }).map((__, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}
