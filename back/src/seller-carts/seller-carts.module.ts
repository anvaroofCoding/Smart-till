import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { SellerCart, SellerCartSchema } from './schemas/seller-cart.schema';
import { SellerCartsController } from './seller-carts.controller';
import { SellerCartsService } from './seller-carts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SellerCart.name, schema: SellerCartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    OrdersModule,
    UsersModule,
  ],
  controllers: [SellerCartsController],
  providers: [SellerCartsService],
  exports: [SellerCartsService],
})
export class SellerCartsModule {}
