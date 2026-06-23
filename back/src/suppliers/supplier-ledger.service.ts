import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateSupplierLedgerEntryDto,
  SupplierLedgerSummaryDto,
} from './dto/supplier-ledger.dto';
import { toSupplierLedgerEntryResponse } from './supplier-ledger.mapper';
import {
  SupplierLedgerEntry,
  SupplierLedgerEntryDocument,
  SupplierLedgerType,
} from './schemas/supplier-ledger-entry.schema';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';

@Injectable()
export class SupplierLedgerService {
  constructor(
    @InjectModel(SupplierLedgerEntry.name)
    private readonly ledgerModel: Model<SupplierLedgerEntryDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async findAll(supplierId: string, pagination: PaginationDto) {
    await this.ensureSupplierExists(supplierId);

    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const filter = { supplierId: new Types.ObjectId(supplierId) };

    const [items, total, summary] = await Promise.all([
      this.ledgerModel
        .find(filter)
        .sort({ createdAt: -1, entryNumber: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.ledgerModel.countDocuments(filter),
      this.getSummary(supplierId),
    ]);

    return {
      data: items.map((item) => toSupplierLedgerEntryResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
      summary,
    };
  }

  async createEntry(
    supplierId: string,
    type: SupplierLedgerType,
    dto: CreateSupplierLedgerEntryDto,
  ): Promise<SupplierLedgerEntryDocument> {
    await this.ensureSupplierExists(supplierId);

    const amountUzs = normalizeAmount(dto.amountUzs);
    const amountUsd = normalizeAmount(dto.amountUsd);

    if (amountUzs <= 0 && amountUsd <= 0) {
      throw new BadRequestException(
        'Kamida bitta valyutada summani kiriting',
      );
    }

    const entryNumber = await this.getNextEntryNumber(supplierId);

    const entry = await this.ledgerModel.create({
      supplierId: new Types.ObjectId(supplierId),
      type,
      entryNumber,
      amountUzs,
      amountUsd,
    });

    return entry;
  }

  private async getSummary(
    supplierId: string,
  ): Promise<SupplierLedgerSummaryDto> {
    const objectId = new Types.ObjectId(supplierId);

    const [result] = await this.ledgerModel
      .aggregate<{
        totalPaymentUzs: number;
        totalPaymentUsd: number;
        totalDebtUzs: number;
        totalDebtUsd: number;
      }>([
        { $match: { supplierId: objectId } },
        {
          $group: {
            _id: null,
            totalPaymentUzs: {
              $sum: {
                $cond: [{ $eq: ['$type', 'payment'] }, '$amountUzs', 0],
              },
            },
            totalPaymentUsd: {
              $sum: {
                $cond: [{ $eq: ['$type', 'payment'] }, '$amountUsd', 0],
              },
            },
            totalDebtUzs: {
              $sum: {
                $cond: [{ $eq: ['$type', 'debt'] }, '$amountUzs', 0],
              },
            },
            totalDebtUsd: {
              $sum: {
                $cond: [{ $eq: ['$type', 'debt'] }, '$amountUsd', 0],
              },
            },
          },
        },
      ])
      .exec();

    const totalPaymentUzs = roundMoney(result?.totalPaymentUzs ?? 0);
    const totalPaymentUsd = roundMoney(result?.totalPaymentUsd ?? 0);
    const totalDebtUzs = roundMoney(result?.totalDebtUzs ?? 0);
    const totalDebtUsd = roundMoney(result?.totalDebtUsd ?? 0);

    return {
      totalPaymentUzs,
      totalPaymentUsd,
      totalDebtUzs,
      totalDebtUsd,
      netDebtUzs: roundMoney(totalDebtUzs - totalPaymentUzs),
      netDebtUsd: roundMoney(totalDebtUsd - totalPaymentUsd),
    };
  }

  private async getNextEntryNumber(supplierId: string): Promise<number> {
    const last = await this.ledgerModel
      .findOne({ supplierId: new Types.ObjectId(supplierId) })
      .sort({ entryNumber: -1 })
      .select('entryNumber')
      .exec();

    return (last?.entryNumber ?? 0) + 1;
  }

  private async ensureSupplierExists(supplierId: string) {
    if (!Types.ObjectId.isValid(supplierId)) {
      throw new NotFoundException('Yetkazib beruvchi topilmadi');
    }

    const supplier = await this.supplierModel.findById(supplierId).exec();
    if (!supplier) {
      throw new NotFoundException('Yetkazib beruvchi topilmadi');
    }
  }
}

function normalizeAmount(value?: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }

  return roundMoney(value);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
