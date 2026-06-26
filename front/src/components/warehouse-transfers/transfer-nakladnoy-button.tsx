import { useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import {
  canDownloadTransferNakladnoy,
  downloadTransferNakladnoy,
} from '@/lib/transfer-nakladnoy-docx'
import type { WarehouseTransferRecord } from '@/types/warehouse-transfer.types'

interface TransferNakladnoyButtonProps {
  transfer: WarehouseTransferRecord
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function TransferNakladnoyButton({
  transfer,
  variant = 'outline',
  size = 'default',
  className,
}: TransferNakladnoyButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  if (!canDownloadTransferNakladnoy(transfer.status)) {
    return null
  }

  async function handleDownload() {
    setIsDownloading(true)
    try {
      await downloadTransferNakladnoy(transfer)
      notify.success('Word nakladnoy yuklab olindi')
    } catch (error) {
      notify.error(
        getApiErrorMessage(
          error,
          'Word nakladnoyni yuklab olish amalga oshmadi',
        ),
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={isDownloading}
      onClick={() => void handleDownload()}
    >
      <AppIcon name="excel" />
      {isDownloading ? 'Tayyorlanmoqda...' : 'Word nakladnoy'}
    </Button>
  )
}
