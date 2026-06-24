import type { PaginatedResponse } from '@/types/api.types'

export interface InstallmentPlan {
  months: number
  interestPercent: number
}

export interface PaymentTypeRecord {
  id: string
  name: string
  logo: string
  installmentPlans: InstallmentPlan[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PaymentTypesListResponse = PaginatedResponse<PaymentTypeRecord>

export interface CreatePaymentTypeRequest {
  name: string
  logo?: string
  installmentPlans?: InstallmentPlan[]
  isActive?: boolean
}

export type UpdatePaymentTypeRequest = Partial<CreatePaymentTypeRequest>
