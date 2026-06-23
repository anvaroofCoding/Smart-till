import type { PaginatedResponse } from '@/types/api.types'

export interface SupplierLedgerEntryRecord {
  id: string
  entryNumber: number
  paymentUzs: number
  paymentUsd: number
  debtUzs: number
  debtUsd: number
  createdAt: string
}

export interface SupplierLedgerSummary {
  totalPaymentUzs: number
  totalPaymentUsd: number
  totalDebtUzs: number
  totalDebtUsd: number
  netDebtUzs: number
  netDebtUsd: number
}

export interface SupplierLedgerListResponse
  extends PaginatedResponse<SupplierLedgerEntryRecord> {
  summary: SupplierLedgerSummary
}

export interface CreateSupplierLedgerEntryRequest {
  amountUzs?: number
  amountUsd?: number
}

export type SupplierLedgerEntryType = 'debt' | 'payment'
