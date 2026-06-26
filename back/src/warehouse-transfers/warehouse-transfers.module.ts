import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  StockMovement,
  StockMovementSchema,
} from '../stock-movements/schemas/stock-movement.schema';
import { Warehouse, WarehouseSchema } from '../warehouses/schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import {
  WarehouseTransfer,
  WarehouseTransferSchema,
} from './schemas/warehouse-transfer.schema';
import { WarehouseTransfersController } from './warehouse-transfers.controller';
import { WarehouseTransfersService } from './warehouse-transfers.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ProductsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: WarehouseTransfer.name, schema: WarehouseTransferSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
    ]),
  ],
  controllers: [WarehouseTransfersController],
  providers: [WarehouseTransfersService],
  exports: [WarehouseTransfersService],
})
export class WarehouseTransfersModule {}
