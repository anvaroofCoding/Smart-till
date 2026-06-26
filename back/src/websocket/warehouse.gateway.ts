import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  CLIENT_EVENTS,
  SOCKET_EVENTS,
} from './events/socket.events';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WarehouseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WarehouseGateway.name);

  constructor(private readonly config: ConfigService) {}

  afterInit() {
    const origins = this.config.get<string[]>('app.corsOrigins');
    this.logger.log(`WebSocket gateway initialized (CORS: ${origins?.join(', ')})`);
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(CLIENT_EVENTS.INVENTORY_SUBSCRIBE)
  handleInventorySubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { warehouseId?: string },
  ) {
    const room = payload?.warehouseId
      ? `warehouse:${payload.warehouseId}`
      : 'warehouse:default';

    void client.join(room);
    return { subscribed: true, room };
  }

  @SubscribeMessage(CLIENT_EVENTS.INVENTORY_UNSUBSCRIBE)
  handleInventoryUnsubscribe(@ConnectedSocket() client: Socket) {
    const rooms = [...client.rooms].filter((r) => r.startsWith('warehouse:'));
    rooms.forEach((room) => void client.leave(room));
    return { subscribed: false };
  }

  @SubscribeMessage(CLIENT_EVENTS.USER_SUBSCRIBE)
  handleUserSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: string },
  ) {
    const userRooms = [...client.rooms].filter((room) => room.startsWith('user:'));
    userRooms.forEach((room) => void client.leave(room));

    if (!payload?.userId) {
      return { subscribed: false };
    }

    const room = `user:${payload.userId}`;
    void client.join(room);
    return { subscribed: true, room };
  }

  @SubscribeMessage(CLIENT_EVENTS.SCANNER_REGISTER)
  handleScannerRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { deviceId: string },
  ) {
    void client.join(`scanner:${payload.deviceId}`);
    this.logger.log(`Scanner registered: ${payload.deviceId}`);
    return { registered: true, deviceId: payload.deviceId };
  }

  @SubscribeMessage(CLIENT_EVENTS.SCANNER_SCAN)
  handleScannerScan(
    @MessageBody() payload: { barcode: string; timestamp: string },
  ) {
    this.server.emit(SOCKET_EVENTS.INVENTORY_SCANNED, {
      barcode: payload.barcode,
      timestamp: payload.timestamp,
    });

    return { received: true };
  }

  emitInventoryUpdated(
    room: string,
    payload: {
      itemId: string;
      sku: string;
      quantity: number;
      location: string;
      updatedAt: string;
    },
  ) {
    this.server.to(room).emit(SOCKET_EVENTS.INVENTORY_UPDATED, payload);
  }

  emitWarehouseAlert(payload: {
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }) {
    this.server.emit(SOCKET_EVENTS.WAREHOUSE_ALERT, payload);
  }

  emitNotificationCreated(payload: {
    timestamp: string;
    userIds: string[];
    items?: Array<{
      userId: string;
      notification: {
        id: string;
        type: string;
        title: string;
        message: string;
        entityType?: string;
        entityId?: string;
        metadata?: Record<string, unknown>;
        readAt?: Date;
        createdAt: Date;
      };
    }>;
  }) {
    const emittedTo = new Set<string>();

    for (const userId of payload.userIds) {
      if (emittedTo.has(userId)) {
        continue;
      }

      emittedTo.add(userId);
      this.server.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, payload);
    }
  }
}
