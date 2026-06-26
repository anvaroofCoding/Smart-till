import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import QRCode from 'qrcode'

import { APP_NAME } from '@/config/app'
import { formatDateDisplay } from '@/lib/date-format'
import { getTransferNakladnoyUrl } from '@/lib/transfer-qr'
import { TRANSFER_STATUS_LABELS } from '@/lib/warehouse-transfer'
import type { WarehouseTransferRecord } from '@/types/warehouse-transfer.types'

const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '1F2937',
}

const HEADER_SHADING = { fill: 'E8EEF7' }

function formatAmount(value: number): string {
  return value.toLocaleString('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}

function formatMoney(value: number): string {
  return value.toLocaleString('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function cell(
  text: string,
  options: {
    bold?: boolean
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]
    width?: number
    header?: boolean
    colSpan?: number
    rowSpan?: number
    size?: number
  } = {},
): TableCell {
  const {
    bold = false,
    align = AlignmentType.LEFT,
    width,
    header = false,
    colSpan,
    rowSpan,
    size = header ? 20 : 18,
  } = options

  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: header ? HEADER_SHADING : undefined,
    columnSpan: colSpan,
    rowSpan,
    borders: {
      top: TABLE_BORDER,
      bottom: TABLE_BORDER,
      left: TABLE_BORDER,
      right: TABLE_BORDER,
    },
    margins: {
      top: 80,
      bottom: 80,
      left: 120,
      right: 120,
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text,
            bold: bold || header,
            size,
            font: 'Arial',
          }),
        ],
      }),
    ],
  })
}

function infoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      cell(label, { bold: true, width: 3200 }),
      cell(value, { width: 6200 }),
    ],
  })
}

function signatureBlock(title: string, role: string): TableCell {
  return new TableCell({
    width: { size: 4700, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    children: [
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({ text: title, bold: true, size: 20, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: role,
            size: 18,
            font: 'Arial',
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 320, after: 80 },
        children: [
          new TextRun({ text: 'F.I.Sh.: _________________________', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Imzo: ___________________________', size: 18, font: 'Arial' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Sana: «____» __________ 20___ y.', size: 18, font: 'Arial' }),
        ],
      }),
    ],
  })
}

export function canDownloadTransferNakladnoy(
  status: WarehouseTransferRecord['status'],
): boolean {
  return status === 'sent' || status === 'completed'
}

async function createTransferQrImage(transferId: string): Promise<ImageRun> {
  const dataUrl = await QRCode.toDataURL(getTransferNakladnoyUrl(transferId), {
    margin: 1,
    width: 256,
  })
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new ImageRun({
    data: bytes,
    transformation: { width: 110, height: 110 },
    type: 'png',
  })
}

export async function buildTransferNakladnoyDocument(
  transfer: WarehouseTransferRecord,
): Promise<Document> {
  const qrImage = await createTransferQrImage(transfer.id)
  const transferDate = formatDateDisplay(transfer.transferDate) || '—'
  const statusLabel = TRANSFER_STATUS_LABELS[transfer.status]
  const isCompleted = transfer.status === 'completed'
  const documentTitle = transfer.name?.trim() || 'Omborlararo tovar o\'tkazmasi'

  const totalQuantity = transfer.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalReceived = transfer.items.reduce(
    (sum, item) => sum + (item.receivedQuantity ?? 0),
    0,
  )
  const totalAmount = transfer.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )

  const itemHeader = isCompleted
    ? ['№', 'Maxsulot nomi', 'Shtrix-kod', 'Birlik', 'Yuborilgan', 'Qabul qilingan', 'Narx', 'Summa']
    : ['№', 'Maxsulot nomi', 'Shtrix-kod', 'Birlik', 'Yuborilgan', 'Qabul (fakt)', 'Tekshirildi', 'Izoh']

  const itemRows = transfer.items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice
    const receivedText = isCompleted
      ? formatAmount(item.receivedQuantity ?? 0)
      : ''

    if (isCompleted) {
      return new TableRow({
        children: [
          cell(String(index + 1), { align: AlignmentType.CENTER }),
          cell(item.productName),
          cell(item.productBarcode || '—', { align: AlignmentType.CENTER }),
          cell('dona', { align: AlignmentType.CENTER }),
          cell(formatAmount(item.quantity), { align: AlignmentType.RIGHT }),
          cell(receivedText, { align: AlignmentType.RIGHT }),
          cell(formatMoney(item.unitPrice), { align: AlignmentType.RIGHT }),
          cell(formatMoney(lineTotal), { align: AlignmentType.RIGHT }),
        ],
      })
    }

    return new TableRow({
      children: [
        cell(String(index + 1), { align: AlignmentType.CENTER }),
        cell(item.productName),
        cell(item.productBarcode || '—', { align: AlignmentType.CENTER }),
        cell('dona', { align: AlignmentType.CENTER }),
        cell(formatAmount(item.quantity), { align: AlignmentType.RIGHT }),
        cell('', { align: AlignmentType.CENTER }),
        cell('☐', { align: AlignmentType.CENTER }),
        cell(''),
      ],
    })
  })

  const totalsRow = isCompleted
    ? new TableRow({
        children: [
          cell('JAMI', { bold: true, colSpan: 4, align: AlignmentType.RIGHT }),
          cell(formatAmount(totalQuantity), { bold: true, align: AlignmentType.RIGHT }),
          cell(formatAmount(totalReceived), { bold: true, align: AlignmentType.RIGHT }),
          cell('', { colSpan: 2 }),
          cell(formatMoney(totalAmount), { bold: true, align: AlignmentType.RIGHT }),
        ],
      })
    : new TableRow({
        children: [
          cell('JAMI', { bold: true, colSpan: 4, align: AlignmentType.RIGHT }),
          cell(formatAmount(totalQuantity), { bold: true, align: AlignmentType.RIGHT }),
          cell('', { colSpan: 3 }),
        ],
      })

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080,
              right: 900,
              bottom: 1080,
              left: 900,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: APP_NAME.toUpperCase(),
                bold: true,
                size: 28,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Tovar aylanma nakladnoyi',
                size: 22,
                font: 'Arial',
                color: '374151',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `NAKLADNOY № ${transfer.code}`,
                bold: true,
                size: 32,
                font: 'Arial',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              infoRow('Hujjat nomi', documentTitle),
              infoRow('Sana', transferDate),
              infoRow('Holat', statusLabel),
              infoRow('Yuboruvchi ombor (do\'kon)', transfer.fromWarehouseName),
              infoRow('Qabul qiluvchi ombor (do\'kon)', transfer.toWarehouseName || '—'),
            ],
          }),
          new Paragraph({
            spacing: { before: 240, after: 200 },
            children: [
              new TextRun({
                text:
                  'Maqsad: ushbu nakladnoy omborlar (do\'konlar) orasidagi tovar o\'tkazmasini rasmiy tasdiqlash, qabul qilish va tekshirish uchun tuzilgan. Qabul qiluvchi tomon qabul qilingan miqdorni belgilab, imzo qo\'yadi.',
                size: 18,
                font: 'Arial',
                italics: true,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: itemHeader.map((header) =>
                  cell(header, { header: true, align: AlignmentType.CENTER, size: 18 }),
                ),
              }),
              ...itemRows,
              totalsRow,
            ],
          }),
          ...(transfer.notes.trim()
            ? [
                new Paragraph({
                  spacing: { before: 200, after: 80 },
                  children: [
                    new TextRun({ text: 'Izoh: ', bold: true, size: 18, font: 'Arial' }),
                    new TextRun({
                      text: transfer.notes.trim(),
                      size: 18,
                      font: 'Arial',
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            spacing: { before: 280, after: 120 },
            children: [
              new TextRun({
                text: 'Tovarlar qabul qilinganligi tasdiqlanadi:',
                bold: true,
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  signatureBlock('Topshirdi (yuboruvchi)', transfer.fromWarehouseName),
                  signatureBlock('Qabul qildi (qabul qiluvchi)', transfer.toWarehouseName || '—'),
                ],
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 280, after: 80 },
            children: [qrImage],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Telefonda kelgan tovarlarni tekshirish uchun QR kodni skanerlang',
                size: 16,
                font: 'Arial',
                color: '374151',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 240 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Hujjat tizimda avtomatik shakllantirildi · ${APP_NAME}`,
                size: 16,
                font: 'Arial',
                color: '6B7280',
              }),
            ],
          }),
        ],
      },
    ],
  })
}

export async function downloadTransferNakladnoy(
  transfer: WarehouseTransferRecord,
): Promise<void> {
  if (!canDownloadTransferNakladnoy(transfer.status)) {
    throw new Error('Faqat yuborilgan yoki qabul qilingan transfer uchun nakladnoy yaratiladi')
  }

  const wordDocument = await buildTransferNakladnoyDocument(transfer)
  const blob = await Packer.toBlob(wordDocument)
  const safeCode = transfer.code.replace(/[^\w-]+/g, '_')
  const fileName = `nakladnoy-${safeCode}.docx`

  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
