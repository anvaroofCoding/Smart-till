import { Link } from 'react-router-dom'
import QRCode from 'react-qr-code'

import { Button } from '@/components/ui/button'
import {
  canShowTransferQr,
  getTransferNakladnoyPath,
  getTransferNakladnoyUrl,
} from '@/lib/transfer-qr'
import type { WarehouseTransferRecord } from '@/types/warehouse-transfer.types'

interface TransferQrPanelProps {
  transfer: WarehouseTransferRecord
  compact?: boolean
}

export function TransferQrPanel({ transfer, compact = false }: TransferQrPanelProps) {
  if (!canShowTransferQr(transfer.status)) {
    return null
  }

  const nakladnoyUrl = getTransferNakladnoyUrl(transfer.id)
  const nakladnoyPath = getTransferNakladnoyPath(transfer.id)

  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center gap-2'
          : 'bg-card flex flex-col items-center gap-3 rounded-xl border p-4 shadow-sm'
      }
    >
      <div className="rounded-lg border bg-white p-3">
        <QRCode
          value={nakladnoyUrl}
          size={compact ? 128 : 168}
          level="M"
          bgColor="#ffffff"
          fgColor="#111827"
        />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">Nakladnoy QR</p>
        <p className="text-muted-foreground max-w-[220px] text-xs leading-relaxed">
          Telefonda qaysi tovarlar kelganini ko&apos;rish uchun skanerlang
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full max-w-[220px]" asChild>
        <Link to={nakladnoyPath} target="_blank" rel="noopener noreferrer">
          Nakladnoyni ochish
        </Link>
      </Button>
    </div>
  )
}
