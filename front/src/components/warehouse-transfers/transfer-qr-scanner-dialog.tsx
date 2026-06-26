import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/notify'
import {
  getTransferNakladnoyPath,
  parseTransferIdFromQrScan,
} from '@/lib/transfer-qr'

interface TransferQrScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferQrScannerDialog({
  open,
  onOpenChange,
}: TransferQrScannerDialogProps) {
  const navigate = useNavigate()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const regionId = useId().replace(/:/g, '')

  useEffect(() => {
    if (!open) return

    const scanner = new Html5QrcodeScanner(
      regionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false,
    )

    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        const transferId = parseTransferIdFromQrScan(decodedText)
        if (!transferId) {
          notify.error('Transfer QR kodi topilmadi')
          return
        }

        void scanner.clear().catch(() => undefined)
        scannerRef.current = null
        onOpenChange(false)
        navigate(getTransferNakladnoyPath(transferId))
      },
      () => undefined,
    )

    return () => {
      if (!scannerRef.current) return
      void scannerRef.current.clear().catch(() => undefined)
      scannerRef.current = null
    }
  }, [navigate, onOpenChange, open, regionId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer QR skaner</DialogTitle>
          <DialogDescription>
            Nakladnoy QR kodini skanerlang. Telefonda kelgan tovarlar ro&apos;yxati
            ochiladi.
          </DialogDescription>
        </DialogHeader>
        <div id={regionId} className="overflow-hidden rounded-lg" />
      </DialogContent>
    </Dialog>
  )
}

interface TransferQrScannerButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function TransferQrScannerButton({
  variant = 'outline',
  size = 'default',
}: TransferQrScannerButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}>
        <AppIcon name="search" />
        QR skaner
      </Button>
      <TransferQrScannerDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
