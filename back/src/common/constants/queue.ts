export const QUEUE_NAMES = {
  IMPORT_EXPORT: 'import-export',
  NOTIFICATIONS: 'notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
