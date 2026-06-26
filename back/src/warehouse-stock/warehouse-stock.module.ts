import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
} from './schemas/warehouse-stock.schema';
import { PriceSettingsModule } from '../price-settings/price-settings.module';
import { WarehouseStockController } from './warehouse-stock.controller';
import { WarehouseStockService } from './warehouse-stock.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    ProductsModule,
    PriceSettingsModule,
    MongooseModule.forFeature([
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
    ]),
  ],
  controllers: [WarehouseStockController],
  providers: [WarehouseStockService],
  exports: [WarehouseStockService, MongooseModule],
})
export class WarehouseStockModule {}
