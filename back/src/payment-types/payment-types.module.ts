import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentType,
  PaymentTypeSchema,
} from './schemas/payment-type.schema';
import { PaymentTypesController } from './payment-types.controller';
import { PaymentTypesService } from './payment-types.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentType.name, schema: PaymentTypeSchema },
    ]),
  ],
  controllers: [PaymentTypesController],
  providers: [PaymentTypesService],
  exports: [PaymentTypesService],
})
export class PaymentTypesModule {}
