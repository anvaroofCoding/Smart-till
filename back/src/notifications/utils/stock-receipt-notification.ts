import { AcceptStockReceiptDto } from '../../stock-receipts/dto/stock-receipt.dto';
import { StockReceiptDocument } from '../../stock-receipts/schemas/stock-receipt.schema';
import type { NotificationType } from '../constants/notification-type';

interface AcceptLine {
  productName: string;
  ordered: number;
  received: number;
}

function findReceiptItem(
  receipt: StockReceiptDocument,
  itemId: string,
) {
  return receipt.items.find(
    (entry) =>
      (entry as typeof entry & { _id?: { toString(): string } })._id?.toString() ===
      itemId,
  );
}

function getReceivedQuantity(
  entry: AcceptStockReceiptDto['items'][number],
  ordered: number,
): number {
  if (!entry.received) {
    return 0;
  }

  return entry.receivedQuantity ?? ordered;
}

export function buildStockReceiptAcceptNotification(
  receipt: StockReceiptDocument,
  dto: AcceptStockReceiptDto,
): {
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
} {
  const lines: AcceptLine[] = [];
  let isPartial = false;

  for (const entry of dto.items) {
    const item = findReceiptItem(receipt, entry.itemId);
    if (!item) {
      continue;
    }

    const ordered = item.quantity;
    const received = getReceivedQuantity(entry, ordered);

    if (!entry.received || received < ordered) {
      isPartial = true;
    }

    lines.push({
      productName: item.productName,
      ordered,
      received,
    });
  }

  const receiptId = receipt._id.toString();
  const receiptName = receipt.name;

  if (isPartial) {
    const details = lines
      .filter((line) => line.received !== line.ordered)
      .map(
        (line) =>
          `${line.productName}: yuborilgan ${line.ordered} ta, qabul qilingan ${line.received} ta`,
      )
      .join('; ');

    return {
      type: 'stock_receipt_partial',
      title: 'Kirim qisman qabul qilindi',
      message: details
        ? `Kirim «${receiptName}» qisman qabul qilindi. ${details}.`
        : `Kirim «${receiptName}» qisman qabul qilindi.`,
      metadata: {
        receiptId,
        receiptName,
        lines,
      },
    };
  }

  return {
    type: 'stock_receipt_accepted',
    title: 'Kirim qabul qilindi',
    message: `Kirim «${receiptName}» qabul qilindi.`,
    metadata: {
      receiptId,
      receiptName,
    },
  };
}
