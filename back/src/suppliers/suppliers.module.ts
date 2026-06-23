import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SupplierLedgerEntry,
  SupplierLedgerEntrySchema,
} from './schemas/supplier-ledger-entry.schema';
import { Supplier, SupplierSchema } from './schemas/supplier.schema';
import { SupplierLedgerService } from './supplier-ledger.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: SupplierLedgerEntry.name, schema: SupplierLedgerEntrySchema },
    ]),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService, SupplierLedgerService],
  exports: [SuppliersService, SupplierLedgerService],
})
export class SuppliersModule {}