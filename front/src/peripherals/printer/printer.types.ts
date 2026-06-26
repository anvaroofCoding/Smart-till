export type PrinterType = 'browser' | 'thermal' | 'label'

export interface LabelSize {
  widthMm: number
  heightMm: number
}

export interface PrintLabelData {
  barcode: string
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
