import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '../constants/notification-type';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  entityType?: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationUnreadCountDto {
  @ApiProperty()
  count: number;
}
