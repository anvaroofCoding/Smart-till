import { AcceptWarehouseTransferDto } from '../../warehouse-transfers/dto/warehouse-transfer.dto';
import { WarehouseTransferDocument } from '../../warehouse-transfers/schemas/warehouse-transfer.schema';
import type { NotificationType } from '../constants/notification-type';

interface AcceptLine {
  productName: string;
  sent: number;
  received: number;
}

function findTransferItem(
  transfer: WarehouseTransferDocument,
  itemId: string,
) {
  return transfer.items.find(
    (entry: WarehouseTransferDocument['items'][number]) =>
      (entry as typeof entry & { _id?: { toString(): string } })._id?.toString() ===
      itemId,
  );
}

function getReceivedQuantity(
  entry: AcceptWarehouseTransferDto['items'][number],
  sent: number,
): number {
  if (!entry.received) {
    return 0;
  }

  return entry.receivedQuantity ?? sent;
}

export function buildWarehouseTransferSentNotification(
  transfer: WarehouseTransferDocument,
  fromWarehouseName: string,
  toWarehouseName: string,
) {
  return {
    type: 'warehouse_transfer_sent' as NotificationType,
    title: 'Yangi transfer yuborildi',
    message: `${fromWarehouseName} omboridan ${toWarehouseName} omboriga transfer «${transfer.code}» yuborildi.`,
    metadata: {
      transferId: transfer._id.toString(),
      transferCode: transfer.code,
      fromWarehouseId: transfer.fromWarehouseId.toString(),
      toWarehouseId: transfer.toWarehouseId?.toString() ?? '',
    },
  };
}

export function buildWarehouseTransferAcceptNotification(
  transfer: WarehouseTransferDocument,
  dto: AcceptWarehouseTransferDto,
  fromWarehouseName: string,
  toWarehouseName: string,
) {
  const lines: AcceptLine[] = [];
  let isPartial = false;

  for (const entry of dto.items) {
    const item = findTransferItem(transfer, entry.itemId);
    if (!item) continue;

    const sent = item.quantity;
    const received = getReceivedQuantity(entry, sent);

    if (!entry.received || received < sent) {
      isPartial = true;
    }

    lines.push({
      productName: item.productName,
      sent,
      received,
    });
  }

  if (isPartial) {
    const details = lines
      .filter((line) => line.received !== line.sent)
      .map(
        (line) =>
          `${line.productName}: yuborilgan ${line.sent} ta, qabul qilingan ${line.received} ta`,
      )
      .join('; ');

    return {
      type: 'warehouse_transfer_partial' as NotificationType,
      title: 'Transfer qisman qabul qilindi',
      message: details
        ? `Transfer «${transfer.code}» (${fromWarehouseName} → ${toWarehouseName}) qisman qabul qilindi. Qolgan miqdor yuboruvchi omborga qaytarildi. ${details}.`
        : `Transfer «${transfer.code}» qisman qabul qilindi. Qolgan miqdor yuboruvchi omborga qaytarildi.`,
      metadata: {
        transferId: transfer._id.toString(),
        transferCode: transfer.code,
        lines,
      },
    };
  }

  return {
    type: 'warehouse_transfer_accepted' as NotificationType,
    title: 'Transfer qabul qilindi',
    message: `Transfer «${transfer.code}» ${toWarehouseName} omborida to'liq qabul qilindi.`,
    metadata: {
      transferId: transfer._id.toString(),
      transferCode: transfer.code,
    },
  };
}
