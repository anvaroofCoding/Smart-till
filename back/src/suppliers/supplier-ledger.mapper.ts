import { SupplierLedgerEntryResponseDto } from './dto/supplier-ledger.dto';
import { SupplierLedgerEntryDocument } from './schemas/supplier-ledger-entry.schema';

export function toSupplierLedgerEntryResponse(
  entry: SupplierLedgerEntryDocument,
): SupplierLedgerEntryResponseDto {
  const isPayment = entry.type === 'payment';

  return {
    id: entry._id.toString(),
    entryNumber: entry.entryNumber,
    paymentUzs: isPayment ? entry.amountUzs : 0,
    paymentUsd: isPayment ? entry.amountUsd : 0,
    debtUzs: isPayment ? 0 : entry.amountUzs,
    debtUsd: isPayment ? 0 : entry.amountUsd,
    createdAt: (entry as SupplierLedgerEntryDocument & { createdAt: Date })
      .createdAt,
  };
}
