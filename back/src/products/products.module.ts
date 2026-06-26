import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductBrand,
  ProductBrandSchema,
} from '../product-brands/schemas/product-brand.schema';
import {
  ProductCategory,
  ProductCategorySchema,
} from '../product-categories/schemas/product-category.schema';
import { ProductBarcodesService } from './product-barcodes.service';
import { Product, ProductSchema } from './schemas/product.schema';
import {
  ProductBarcode,
  ProductBarcodeSchema,
} from './schemas/product-barcode.schema';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductBarcode.name, schema: ProductBarcodeSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: ProductBrand.name, schema: ProductBrandSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductBarcodesService],
  exports: [ProductsService, ProductBarcodesService],
})
export class ProductsModule {}
