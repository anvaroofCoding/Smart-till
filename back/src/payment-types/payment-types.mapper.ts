import { PaymentTypeResponseDto } from './dto/payment-type.dto';
import { PaymentTypeDocument } from './schemas/payment-type.schema';

export function toPaymentTypeResponse(
  paymentType: PaymentTypeDocument,
): PaymentTypeResponseDto {
  return {
    id: paymentType._id.toString(),
    name: paymentType.name,
    logo: paymentType.logo ?? '',
    installmentPlans: (paymentType.installmentPlans ?? []).map((plan) => ({
      months: plan.months,
      interestPercent: plan.interestPercent,
    })),
    channel: paymentType.channel ?? 'other',
    isActive: paymentType.isActive,
    systemKey: paymentType.systemKey,
    isSystem: !!paymentType.systemKey,
    createdAt: (paymentType as PaymentTypeDocument & { createdAt: Date })
      .createdAt,
    updatedAt: (paymentType as PaymentTypeDocument & { updatedAt: Date })
      .updatedAt,
  };
}
