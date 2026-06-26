import { Badge } from '@/components/ui/badge'
import { TRANSFER_STATUS_LABELS } from '@/lib/warehouse-transfer'
import { cn } from '@/lib/utils'
import type { WarehouseTransferStatus } from '@/types/warehouse-transfer.types'

export function TransferStatusBadge({
  status,
}: {
  status: WarehouseTransferStatus
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'draft' && 'border-amber-500/40 text-amber-600',
        status === 'sent' && 'border-violet-500/40 text-violet-600',
        status === 'completed' && 'border-sky-500/40 text-sky-600',
      )}
    >
      {TRANSFER_STATUS_LABELS[status]}
    </Badge>
  )
}
