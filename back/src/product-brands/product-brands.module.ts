import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductBrand,
  ProductBrandSchema,
} from './schemas/product-brand.schema';
import { ProductBrandsController } from './product-brands.controller';
import { ProductBrandsService } from './product-brands.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductBrand.name, schema: ProductBrandSchema },
    ]),
  ],
  controllers: [ProductBrandsController],
  providers: [ProductBrandsService],
  exports: [ProductBrandsService],
})
export class ProductBrandsModule {}
