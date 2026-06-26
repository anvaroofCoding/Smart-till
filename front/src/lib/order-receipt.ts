import {
  formatOrderAddress,
  formatOrderCode,
  formatOrderDisplayId,
  formatOrderPhone,
} from '@/lib/order-display'
import { formatMoney } from '@/lib/format-money'
import { formatDateDisplay } from '@/lib/date-format'
import type { OrderRecord } from '@/types/order.types'

export function canPrintOrderReceipt(status: OrderRecord['status']): boolean {
  return status === 'pending_fulfillment' || status === 'confirmed'
}

function buildReceiptHtml(order: OrderRecord): string {
  const itemRows = order.items
    .map(
      (item, index) => `
        <tr>
          <td colspan="5" class="product-name">${index + 1}. ${item.productName}</td>
        </tr>
        <tr class="item-values">
          <td colspan="2"></td>
          <td class="num qty">${item.quantity}</td>
          <td class="num">${formatMoney(item.unitPrice)}</td>
          <td class="num line-total">${formatMoney(item.lineTotal)}</td>
        </tr>
      `,
    )
    .join('')

  const paymentRows = order.payments
    .map(
      (payment) => `
        <tr>
          <td>${payment.paymentTypeName}</td>
          <td class="num">${formatMoney(payment.amount)}</td>
        </tr>
      `,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Chek #${formatOrderDisplayId(order.id)}</title>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #111;
        width: 72mm;
      }
      h1 {
        font-size: 16px;
        text-align: center;
        margin-bottom: 8px;
      }
      .meta { margin-bottom: 10px; }
      .meta p { margin-bottom: 2px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        table-layout: fixed;
      }
      col.col-no { width: 6%; }
      col.col-name { width: 34%; }
      col.col-qty { width: 10%; }
      col.col-price { width: 25%; }
      col.col-total { width: 25%; }
      th, td {
        border-bottom: 1px dashed #ccc;
        padding: 4px 2px;
        text-align: left;
        vertical-align: top;
      }
      th { font-size: 11px; }
      .product-name {
        border-bottom: none;
        font-weight: 600;
        word-break: break-word;
        padding-bottom: 0;
      }
      .item-values td {
        border-bottom: 1px dashed #ccc;
        padding-top: 0;
        padding-bottom: 6px;
        font-size: 11px;
      }
      .num {
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .qty { font-weight: 600; }
      .line-total { font-weight: 700; }
      .summary-row {
        margin-top: 8px;
        font-weight: 700;
        display: flex;
        justify-content: space-between;
      }
      .footer {
        margin-top: 12px;
        text-align: center;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <h1>Savdo cheki</h1>
    <div class="meta">
      <p><strong>Buyurtma:</strong> #${formatOrderDisplayId(order.id)}</p>
      <p><strong>Kod:</strong> ${formatOrderCode(order.id)}</p>
      <p><strong>Sana:</strong> ${formatDateDisplay(order.createdAt) || '—'}</p>
      <p><strong>Mijoz:</strong> ${order.customerName || '—'}</p>
      <p><strong>Telefon:</strong> ${formatOrderPhone(order.customerPhone)}</p>
      <p><strong>Manzil:</strong> ${formatOrderAddress(order)}</p>
    </div>

    <table>
      <colgroup>
        <col class="col-no" />
        <col class="col-name" />
        <col class="col-qty" />
        <col class="col-price" />
        <col class="col-total" />
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>Maxsulot</th>
          <th class="num">Soni</th>
          <th class="num">Narx</th>
          <th class="num">Jami</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="summary-row"><span>Chegirma</span><span>${formatMoney(order.discountTotal)}</span></div>
    <div class="summary-row"><span>Umumiy</span><span>${formatMoney(order.total)}</span></div>
    <div class="summary-row"><span>To'landi</span><span>${formatMoney(order.paidTotal)}</span></div>

    <table>
      <thead>
        <tr>
          <th>To'lov turi</th>
          <th class="num">Summa</th>
        </tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>

    <p class="footer">Xaridingiz uchun rahmat!</p>
  </body>
</html>`
}

export async function printOrderReceipt(order: OrderRecord): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '320px'
  iframe.style.height = '480px'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) throw new Error('Chop etish oynasi ochilmadi')

  doc.open()
  doc.write(buildReceiptHtml(order))
  doc.close()

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve()
    setTimeout(resolve, 300)
  })

  const printWindow = iframe.contentWindow
  if (!printWindow) {
    iframe.remove()
    throw new Error('Chop etish oynasi ochilmadi')
  }

  await new Promise<void>((resolve) => {
    const finish = () => {
      setTimeout(() => iframe.remove(), 500)
      resolve()
    }

    printWindow.addEventListener('afterprint', finish, { once: true })
    printWindow.focus()
    printWindow.print()

    // Ba'zi brauzerlarda afterprint ishlamasa, dialog yopilgach davom etish
    setTimeout(finish, 120_000)
  })
}

const printingOrderIds = new Set<string>()

export async function runOrderReceiptPrintFlow(
  order: OrderRecord,
  recordReceipt: (input: {
    id: string
    body: { action: 'print' | 'skip' }
  }) => { unwrap: () => Promise<unknown> },
): Promise<void> {
  if (printingOrderIds.has(order.id)) return

  printingOrderIds.add(order.id)

  try {
    try {
      await printOrderReceipt(order)
      await recordReceipt({ id: order.id, body: { action: 'print' } }).unwrap()
    } catch {
      await recordReceipt({ id: order.id, body: { action: 'skip' } }).unwrap()
    }
  } finally {
    printingOrderIds.delete(order.id)
  }
}
