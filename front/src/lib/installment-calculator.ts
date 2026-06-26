import type { InstallmentPlan } from '@/types/payment-type.types'

export function calculateInstallmentMonthlyPayment(
  price: number,
  downPayment: number,
  plan: InstallmentPlan,
): number {
  const principal = Math.max(0, price - downPayment)
  const totalWithInterest = principal * (1 + plan.interestPercent / 100)
  return Math.round(totalWithInterest / plan.months)
}

export function buildInstallmentSchedule(
  price: number,
  downPayment: number,
  plans: InstallmentPlan[],
): Array<InstallmentPlan & { monthlyPayment: number }> {
  return [...plans]
    .sort((a, b) => a.months - b.months)
    .map((plan) => ({
      ...plan,
      monthlyPayment: calculateInstallmentMonthlyPayment(
        price,
        downPayment,
        plan,
      ),
    }))
}
