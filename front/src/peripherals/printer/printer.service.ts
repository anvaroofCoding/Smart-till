import { env } from '@/config/env'
import { renderBarcodeSvg } from '@/lib/barcode'
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
  const barcodeSvg = renderBarcodeSvg(data.barcode, {
    height: Math.max(24, Math.round(labelSize.heightMm * 2.2)),
    width: 1.6,
    fontSize: 10,
    displayValue: true,
    margin: 2,
  })

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>&#8203;</title>
    <style>
      @page {
        size: ${labelSize.widthMm}mm ${labelSize.heightMm}mm;
        margin: 0;
      }
      @media print {
        html, body {
          width: ${labelSize.widthMm}mm !important;
          height: ${labelSize.heightMm}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: ${labelSize.widthMm}mm;
        height: ${labelSize.heightMm}mm;
        overflow: hidden;
        background: #fff;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .barcode-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 1mm;
      }
      .barcode-wrap svg {
        display: block;
        width: 100%;
        height: auto;
        max-height: 100%;
      }
    </style>
  </head>
  <body>
    <div class="barcode-wrap">${barcodeSvg}</div>
  </body>
</html>`
}

function buildEscPosCommands(data: PrintLabelData): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(`\x1B\x40${data.barcode}\n\n\x1D\x56\x00`)
}

export class PrinterService {
  async printLabel(
    data: PrintLabelData,
    options: PrintOptions = {},
  ): Promise<PrintResult> {
    const type = options.type ?? 'browser'
    const labelSize = options.labelSize ?? DEFAULT_LABEL_SIZE

    try {
      if (type === 'browser' || type === 'label') {
        await this.printViaBrowser(data, labelSize)
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

    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()

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
