import { NotificationResponseDto } from './dto/notification.dto';
import { NotificationDocument } from './schemas/notification.schema';

export function toNotificationResponse(
  notification: NotificationDocument,
): NotificationResponseDto {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entityType: notification.entityType,
    entityId: notification.entityId?.toString(),
    metadata: notification.metadata ?? {},
    readAt: notification.readAt,
    createdAt: (notification as NotificationDocument & { createdAt: Date })
      .createdAt,
  };
}
