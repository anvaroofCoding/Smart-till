import type { PaymentChannel } from '../../daily-balances/constants/payment-channel';

export const SYSTEM_PAYMENT_TYPE_KEYS = ['cash', 'terminal', 'card'] as const;

export type SystemPaymentTypeKey =
  (typeof SYSTEM_PAYMENT_TYPE_KEYS)[number];

export const SYSTEM_PAYMENT_TYPES: ReadonlyArray<{
  systemKey: SystemPaymentTypeKey;
  name: string;
  channel: PaymentChannel;
}> = [
  { systemKey: 'cash', name: 'Naqd', channel: 'cash' },
  { systemKey: 'terminal', name: 'Terminal', channel: 'terminal' },
  { systemKey: 'card', name: 'Karta', channel: 'card' },
];

export function isSystemPaymentTypeKey(
  value: unknown,
): value is SystemPaymentTypeKey {
  return (
    typeof value === 'string' &&
    (SYSTEM_PAYMENT_TYPE_KEYS as readonly string[]).includes(value)
  );
}
