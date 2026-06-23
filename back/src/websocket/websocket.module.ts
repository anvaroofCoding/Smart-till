import { Module } from '@nestjs/common';
import { WarehouseGateway } from './warehouse.gateway';

@Module({
  providers: [WarehouseGateway],
  exports: [WarehouseGateway],
})
export class WebsocketModule {}
