import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '../constants/notification-type';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: NOTIFICATION_TYPES })
  type: NotificationType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ trim: true })
  entityType?: string;

  @Prop({ type: Types.ObjectId })
  entityId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ type: Date })
  readAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
