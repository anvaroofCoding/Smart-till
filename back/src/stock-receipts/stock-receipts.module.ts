import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Supplier, SupplierSchema } from '../suppliers/schemas/supplier.schema';
import { Warehouse, WarehouseSchema } from '../warehouses/schemas/warehouse.schema';
import {
  StockMovement,
  StockMovementSchema,
} from '../stock-movements/schemas/stock-movement.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import {
  StockReceipt,
  StockReceiptSchema,
} from './schemas/stock-receipt.schema';
import { StockReceiptsController } from './stock-receipts.controller';
import { StockReceiptsService } from './stock-receipts.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    NotificationsModule,
    ProductsModule,
    MongooseModule.forFeature([
      { name: StockReceipt.name, schema: StockReceiptSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [StockReceiptsController],
  providers: [StockReceiptsService],
  exports: [StockReceiptsService],
})
export class StockReceiptsModule {}
