export type PrinterType = 'browser' | 'thermal' | 'label'

export interface LabelSize {
  widthMm: number
  heightMm: number
}

export interface PrintLabelData {
  title: string
  barcode: string
  sku?: string
  quantity?: number
  location?: string
}

export interface PrintOptions {
  type?: PrinterType
  labelSize?: LabelSize
  copies?: number
}

export interface PrintResult {
  success: boolean
  type: PrinterType
  error?: string
}
