import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { TransferNakladnoyContent } from '@/components/warehouse-transfers/transfer-nakladnoy-content'
import { FormPageSkeleton } from '@/components/loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { canShowTransferQr } from '@/lib/transfer-qr'
import { notify } from '@/lib/notify'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useGetWarehouseTransferQuery } from '@/store/api/warehouse-transfers.api'

export function WarehouseTransferNakladnoyPage() {
  const { id = '' } = useParams()
  const transferQuery = useGetWarehouseTransferQuery(id, {
    skip: !id,
    pollingInterval: 15_000,
  })
  const transfer = transferQuery.data

  usePageMeta({
    title: pageTitle(transfer?.code ?? 'Nakladnoy', 'Transfer'),
  })

  useEffect(() => {
    if (!transferQuery.error) return
    notify.error(
      getApiErrorMessage(transferQuery.error, "Nakladnoyni yuklab bo'lmadi"),
    )
  }, [transferQuery.error])

  if (transferQuery.isLoading) {
    return (
      <div className="mx-auto min-h-svh max-w-lg p-4">
        <FormPageSkeleton sections={1} fieldsPerSection={4} />
      </div>
    )
  }

  if (!transfer || !canShowTransferQr(transfer.status)) {
    return (
      <div className="mx-auto flex min-h-svh max-w-lg items-center justify-center p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Nakladnoy topilmadi yoki transfer hali yuborilmagan.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg">
      <TransferNakladnoyContent transfer={transfer} />
    </div>
  )
}
