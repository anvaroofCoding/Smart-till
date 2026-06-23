import { env } from '@/config/env'
import type {
  LabelSize,
  PrintLabelData,
  PrintOptions,
  PrintResult,
} from './printer.types'

const DEFAULT_LABEL_SIZE: LabelSize = {
  widthMm: env.printer.labelWidthMm,
  heightMm: env.printer.labelHeightMm,
}

function mmToPx(mm: number): number {
  return Math.round(mm * 3.7795275591)
}

function buildLabelHtml(data: PrintLabelData, labelSize: LabelSize): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.title}</title>
        <style>
          @page { size: ${labelSize.widthMm}mm ${labelSize.heightMm}mm; margin: 2mm; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 4mm;
            width: ${labelSize.widthMm - 4}mm;
          }
          h1 { font-size: 10pt; margin: 0 0 2mm; }
          .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 24pt; }
          .meta { font-size: 8pt; margin-top: 2mm; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <div class="barcode">${data.barcode}</div>
        ${data.sku ? `<div class="meta">SKU: ${data.sku}</div>` : ''}
        ${data.quantity !== undefined ? `<div class="meta">Qty: ${data.quantity}</div>` : ''}
        ${data.location ? `<div class="meta">Loc: ${data.location}</div>` : ''}
      </body>
    </html>
  `
}

function buildEscPosCommands(data: PrintLabelData): Uint8Array {
  const encoder = new TextEncoder()
  const lines = [
    '\x1B\x40',
    `${data.title}\n`,
    `${data.barcode}\n`,
    data.sku ? `SKU: ${data.sku}\n` : '',
    data.quantity !== undefined ? `Qty: ${data.quantity}\n` : '',
    data.location ? `Loc: ${data.location}\n` : '',
    '\n\n\x1D\x56\x00',
  ]
  return encoder.encode(lines.join(''))
}

export class PrinterService {
  async printLabel(
    data: PrintLabelData,
    options: PrintOptions = {},
  ): Promise<PrintResult> {
    const type = options.type ?? 'browser'
    const labelSize = options.labelSize ?? DEFAULT_LABEL_SIZE
    const copies = options.copies ?? 1

    try {
      if (type === 'browser' || type === 'label') {
        await this.printViaBrowser(data, labelSize, copies)
        return { success: true, type }
      }

      if (type === 'thermal') {
        await this.printViaThermal(data)
        return { success: true, type: 'thermal' }
      }

      return { success: false, type, error: 'Unsupported printer type' }
    } catch (error) {
      return {
        success: false,
        type,
        error: error instanceof Error ? error.message : 'Print failed',
      }
    }
  }

  private async printViaBrowser(
    data: PrintLabelData,
    labelSize: LabelSize,
    copies: number,
  ): Promise<void> {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = `${mmToPx(labelSize.widthMm)}px`
    iframe.style.height = `${mmToPx(labelSize.heightMm)}px`
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document
    if (!doc) throw new Error('Print iframe unavailable')

    doc.open()
    doc.write(buildLabelHtml(data, labelSize))
    doc.close()

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
      setTimeout(resolve, 300)
    })

    for (let i = 0; i < copies; i++) {
      iframe.contentWindow?.print()
    }

    setTimeout(() => iframe.remove(), 1_000)
  }

  private async printViaThermal(data: PrintLabelData): Promise<void> {
    const commands = buildEscPosCommands(data)

    if ('serial' in navigator) {
      const port = await (navigator as Navigator & {
        serial: { requestPort: () => Promise<unknown> }
      }).serial.requestPort()

      // @ts-expect-error Web Serial API types vary by browser
      await port.open({ baudRate: 9600 })
      // @ts-expect-error Web Serial API
      const writer = port.writable?.getWriter()
      await writer?.write(commands)
      writer?.releaseLock()
      // @ts-expect-error Web Serial API
      await port.close()
      return
    }

    throw new Error(
      'Web Serial API mavjud emas. Thermal printer uchun Chrome/Edge ishlating yoki browser print rejimidan foydalaning.',
    )
  }
}

export const printerService = new PrinterService()
