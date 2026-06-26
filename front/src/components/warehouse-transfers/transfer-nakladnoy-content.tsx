import { formatDateDisplay } from '@/lib/date-format'
import { TRANSFER_STATUS_LABELS } from '@/lib/warehouse-transfer'
import type { WarehouseTransferRecord } from '@/types/warehouse-transfer.types'

function formatAmount(value: number) {
  return value.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
}

interface TransferNakladnoyContentProps {
  transfer: WarehouseTransferRecord
}

export function TransferNakladnoyContent({ transfer }: TransferNakladnoyContentProps) {
  const isCompleted = transfer.status === 'completed'
  const totalSent = transfer.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalReceived = transfer.items.reduce(
    (sum, item) => sum + (item.receivedQuantity ?? 0),
    0,
  )

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="bg-slate-900 px-4 py-5 text-white">
        <p className="text-xs font-medium tracking-[0.2em] text-slate-300 uppercase">
          Tovar nakladnoyi
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{transfer.code}</h1>
        {transfer.name?.trim() && (
          <p className="mt-1 text-sm text-slate-300">{transfer.name.trim()}</p>
        )}
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400">Qayerdan</span>
            <span className="text-right font-medium">{transfer.fromWarehouseName}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400">Qayerga</span>
            <span className="text-right font-medium">
              {transfer.toWarehouseName || '—'}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400">Sana</span>
            <span className="font-medium">
              {formatDateDisplay(transfer.transferDate) || '—'}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400">Holat</span>
            <span className="font-medium">{TRANSFER_STATUS_LABELS[transfer.status]}</span>
          </div>
        </div>
      </header>

      <section className="flex-1 px-3 py-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
            <p className="text-sm font-semibold">Kelgan tovarlar</p>
            <p className="text-muted-foreground text-xs">
              Tekshirish va qabul qilish uchun ro&apos;yxat
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {transfer.items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-8 text-center text-sm">
                Maxsulotlar yo&apos;q
              </p>
            ) : (
              transfer.items.map((item, index) => (
                <article key={item.id} className="px-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-slate-900 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug font-semibold">
                        {item.productName}
                      </p>
                      {item.productBarcode && (
                        <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                          {item.productBarcode}
                        </p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                          <p className="text-muted-foreground text-[11px] uppercase">
                            Yuborilgan
                          </p>
                          <p className="text-base font-bold tabular-nums">
                            {formatAmount(item.quantity)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-2.5 py-2">
                          <p className="text-[11px] text-emerald-700 uppercase">
                            {isCompleted ? 'Qabul' : 'Qabul (fakt)'}
                          </p>
                          <p className="text-base font-bold text-emerald-900 tabular-nums">
                            {isCompleted
                              ? formatAmount(item.receivedQuantity ?? 0)
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {transfer.items.length > 0 && (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 px-3 py-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Jami yuborilgan</p>
                <p className="text-lg font-bold tabular-nums">{formatAmount(totalSent)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Jami qabul</p>
                <p className="text-lg font-bold tabular-nums">
                  {isCompleted ? formatAmount(totalReceived) : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {transfer.notes.trim() && (
          <p className="text-muted-foreground mt-4 px-1 text-sm">
            <span className="text-foreground font-medium">Izoh:</span>{' '}
            {transfer.notes.trim()}
          </p>
        )}
      </section>
    </div>
  )
}
