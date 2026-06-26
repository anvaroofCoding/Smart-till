import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyBalancesModule } from '../daily-balances/daily-balances.module';
import { UsersModule } from '../users/users.module';
import { PaymentType, PaymentTypeSchema } from '../payment-types/schemas/payment-type.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  StockMovement,
  StockMovementSchema,
} from '../stock-movements/schemas/stock-movement.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from '../warehouse-stock/schemas/warehouse-stock.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: PaymentType.name, schema: PaymentTypeSchema },
      { name: User.name, schema: UserSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
    ]),
    DailyBalancesModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
