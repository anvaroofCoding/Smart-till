import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import { UserPosition } from '../common/constants/positions';
import { AcceptStockReceiptDto } from '../stock-receipts/dto/stock-receipt.dto';
import { StockReceiptDocument } from '../stock-receipts/schemas/stock-receipt.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { WarehouseGateway } from '../websocket/warehouse.gateway';
import { toNotificationResponse } from './notifications.mapper';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import type { NotificationType } from './constants/notification-type';
import { buildStockReceiptAcceptNotification } from './utils/stock-receipt-notification';
import { buildWarehouseTransferAcceptNotification, buildWarehouseTransferSentNotification } from './utils/warehouse-transfer-notification';
import { AcceptWarehouseTransferDto } from '../warehouse-transfers/dto/warehouse-transfer.dto';
import { WarehouseTransferDocument } from '../warehouse-transfers/schemas/warehouse-transfer.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly warehouseGateway: WarehouseGateway,
  ) {}

  async findForUser(
    userId: string,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
  ) {
    const skip = (page - 1) * perPage;
    const filter = { userId: new Types.ObjectId(userId) };

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toNotificationResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    });

    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { readAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!notification) {
      return null;
    }

    return toNotificationResponse(notification);
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationModel
      .updateMany(
        {
          userId: new Types.ObjectId(userId),
          $or: [{ readAt: null }, { readAt: { $exists: false } }],
        },
        { $set: { readAt: new Date() } },
      )
      .exec();

    return { updated: result.modifiedCount };
  }

  async notifyStockReceiptAccept(
    receipt: StockReceiptDocument,
    dto: AcceptStockReceiptDto,
    acceptedByUserId?: string,
  ) {
    const content = buildStockReceiptAcceptNotification(receipt, dto);
    const recipientIds = await this.findWarehouseNotificationRecipients(
      receipt.warehouseId,
    );

    if (!recipientIds.length) {
      return;
    }

    const documents = recipientIds.map((userId) => ({
      userId,
      type: content.type,
      title: content.title,
      message: content.message,
      entityType: 'stock_receipt',
      entityId: receipt._id,
      metadata: {
        ...content.metadata,
        warehouseId: receipt.warehouseId.toString(),
        acceptedByUserId,
      },
    }));

    const created = await this.notificationModel.insertMany(documents);

    this.warehouseGateway.emitNotificationCreated({
      timestamp: new Date().toISOString(),
      userIds: recipientIds.map((id) => id.toString()),
      items: created.map((notification) => ({
        userId: notification.userId.toString(),
        notification: toNotificationResponse(notification),
      })),
    });
  }

  async notifyWarehouseTransferSent(transfer: WarehouseTransferDocument) {
    if (!transfer.toWarehouseId) {
      return;
    }

    const fromWarehouseName = this.resolveWarehouseName(transfer.fromWarehouseId);
    const toWarehouseName = this.resolveWarehouseName(transfer.toWarehouseId);
    const content = buildWarehouseTransferSentNotification(
      transfer,
      fromWarehouseName,
      toWarehouseName,
    );

    const recipientIds = await this.findWarehouseNotificationRecipients(
      transfer.toWarehouseId,
    );

    await this.createNotifications(recipientIds, content, {
      entityType: 'warehouse_transfer',
      entityId: transfer._id,
      metadata: {
        ...content.metadata,
        toWarehouseId: transfer.toWarehouseId.toString(),
      },
    });
  }

  async notifyWarehouseTransferAccept(
    transfer: WarehouseTransferDocument,
    dto: AcceptWarehouseTransferDto,
    acceptedByUserId?: string,
  ) {
    const fromWarehouseName = this.resolveWarehouseName(transfer.fromWarehouseId);
    const toWarehouseName = this.resolveWarehouseName(transfer.toWarehouseId);
    const content = buildWarehouseTransferAcceptNotification(
      transfer,
      dto,
      fromWarehouseName,
      toWarehouseName,
    );

    const recipientIds = await this.findWarehouseNotificationRecipients(
      transfer.fromWarehouseId,
    );

    await this.createNotifications(recipientIds, content, {
      entityType: 'warehouse_transfer',
      entityId: transfer._id,
      metadata: {
        ...content.metadata,
        fromWarehouseId: transfer.fromWarehouseId.toString(),
        acceptedByUserId,
      },
    });
  }

  private resolveWarehouseName(warehouse: unknown): string {
    if (warehouse && typeof warehouse === 'object' && 'name' in warehouse) {
      return (warehouse as { name: string }).name;
    }
    return '';
  }

  private async createNotifications(
    recipientIds: Types.ObjectId[],
    content: {
      type: NotificationType;
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
    },
    options: {
      entityType: string;
      entityId: Types.ObjectId;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (!recipientIds.length) {
      return;
    }

    const documents = recipientIds.map((userId) => ({
      userId,
      type: content.type,
      title: content.title,
      message: content.message,
      entityType: options.entityType,
      entityId: options.entityId,
      metadata: options.metadata ?? {},
    }));

    const created = await this.notificationModel.insertMany(documents);

    this.warehouseGateway.emitNotificationCreated({
      timestamp: new Date().toISOString(),
      userIds: recipientIds.map((id) => id.toString()),
      items: created.map((notification) => ({
        userId: notification.userId.toString(),
        notification: toNotificationResponse(notification),
      })),
    });
  }

  private async findWarehouseNotificationRecipients(
    warehouseId: Types.ObjectId,
  ): Promise<Types.ObjectId[]> {
    const users = await this.userModel
      .find({
        isActive: true,
        $or: [
          { allWarehouses: true },
          { position: UserPosition.ADMIN },
          { warehouseIds: warehouseId },
        ],
      })
      .select('_id')
      .exec();

    return users.map((user) => user._id);
  }
}
