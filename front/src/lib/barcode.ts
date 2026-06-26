import JsBarcode from 'jsbarcode'

export type BarcodeFormat = 'EAN13' | 'CODE128'

export interface RenderBarcodeOptions {
  format?: BarcodeFormat
  height?: number
  width?: number
  fontSize?: number
  displayValue?: boolean
  margin?: number
}

function resolveBarcodeFormat(value: string): BarcodeFormat {
  return /^\d{13}$/.test(value) ? 'EAN13' : 'CODE128'
}

export function renderBarcodeSvg(
  value: string | null | undefined,
  options: RenderBarcodeOptions = {},
): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const format = options.format ?? resolveBarcodeFormat(trimmed)

  try {
    JsBarcode(svg, trimmed, {
      format,
      displayValue: options.displayValue ?? true,
      fontSize: options.fontSize ?? 12,
      height: options.height ?? 48,
      width: options.width ?? 2,
      margin: options.margin ?? 8,
    })
  } catch {
    JsBarcode(svg, trimmed, {
      format: 'CODE128',
      displayValue: options.displayValue ?? true,
      fontSize: options.fontSize ?? 12,
      height: options.height ?? 48,
      width: options.width ?? 2,
      margin: options.margin ?? 8,
    })
  }

  return svg.outerHTML
}
