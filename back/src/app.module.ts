import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AppCacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { WebsocketModule } from './websocket/websocket.module';
import { UsersModule } from './users/users.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProductBrandsModule } from './product-brands/product-brands.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { StockReceiptsModule } from './stock-receipts/stock-receipts.module';
import { WarehouseStockModule } from './warehouse-stock/warehouse-stock.module';
import { PaymentTypesModule } from './payment-types/payment-types.module';
import { PriceSettingsModule } from './price-settings/price-settings.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DailyBalancesModule } from './daily-balances/daily-balances.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ReportsModule } from './reports/reports.module';
import { SellerCartsModule } from './seller-carts/seller-carts.module';
import { WarehouseTransfersModule } from './warehouse-transfers/warehouse-transfers.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    AppCacheModule,
    QueueModule.register(),
    AuthModule,
    UsersModule,
    ProductCategoriesModule,
    ProductBrandsModule,
    ProductsModule,
    SuppliersModule,
    WarehousesModule,
    StockReceiptsModule,
    WarehouseStockModule,
    PaymentTypesModule,
    PriceSettingsModule,
    OrdersModule,
    NotificationsModule,
    DailyBalancesModule,
    ExpenseCategoriesModule,
    ReportsModule,
    SellerCartsModule,
    WarehouseTransfersModule,
    HealthModule,
    WebsocketModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
