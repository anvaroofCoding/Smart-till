export const PAYMENT_CHANNELS = ['cash', 'terminal', 'card', 'other'] as const;

export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  cash: 'Naqd',
  terminal: 'Terminal',
  card: 'Karta',
  other: 'Boshqa',
};

export function inferPaymentChannel(name: string): PaymentChannel {
  const normalized = name.toLowerCase();

  if (
    normalized.includes('naqd') ||
    normalized.includes('cash') ||
    normalized.includes('nakit')
  ) {
    return 'cash';
  }

  if (
    normalized.includes('terminal') ||
    normalized.includes('pos') ||
    normalized.includes('терминал')
  ) {
    return 'terminal';
  }

  if (
    normalized.includes('karta') ||
    normalized.includes('card') ||
    normalized.includes('карта')
  ) {
    return 'card';
  }

  return 'other';
}
