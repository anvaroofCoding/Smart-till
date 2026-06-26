import type { PaginatedResponse } from '@/types/api.types'

export type SystemPaymentTypeKey = 'cash' | 'terminal' | 'card'

export interface InstallmentPlan {
  months: number
  interestPercent: number
}

export interface PaymentTypeRecord {
  id: string
  name: string
  logo: string
  installmentPlans: InstallmentPlan[]
  channel?: string
  isActive: boolean
  systemKey?: SystemPaymentTypeKey
  isSystem?: boolean
  createdAt: string
  updatedAt: string
}

export function isSystemPaymentType(
  paymentType: Pick<PaymentTypeRecord, 'isSystem' | 'systemKey'>,
): boolean {
  return paymentType.isSystem === true || !!paymentType.systemKey
}

export type PaymentTypesListResponse = PaginatedResponse<PaymentTypeRecord>

export interface CreatePaymentTypeRequest {
  name: string
  logo?: string
  installmentPlans?: InstallmentPlan[]
  isActive?: boolean
}

export type UpdatePaymentTypeRequest = Partial<CreatePaymentTypeRequest>
