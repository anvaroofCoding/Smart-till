import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import {
  buildIdFilter,
  parseCreatedAtFilter,
  parseDateKeyFilter,
} from '../common/utils/list-filter.utils';
import type { UserWarehouseScope } from '../common/utils/user-warehouse-scope';
import {
  emptyPaginatedMeta,
  ensureWarehouseAllowed,
} from '../common/utils/user-warehouse-scope';
import {
  ExpenseCategoriesService,
} from '../expense-categories/expense-categories.service';
import {
  PaymentType,
  PaymentTypeDocument,
} from '../payment-types/schemas/payment-type.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Warehouse,
  WarehouseDocument,
} from '../warehouses/schemas/warehouse.schema';
import {
  inferPaymentChannel,
  type PaymentChannel,
} from './constants/payment-channel';
import {
  AddCashToMainDto,
  AddExpenseDto,
  AddManualIncomeDto,
  DailyBalanceQueryDto,
} from './dto/daily-balance.dto';
import {
  toDailyBalanceDetailResponse,
  toDailyBalanceEntryResponse,
  toDailyBalanceResponse,
  toMainBalanceTransferResponse,
} from './daily-balances.mapper';
import {
  DailyBalance,
  DailyBalanceDocument,
} from './schemas/daily-balance.schema';
import {
  DailyBalanceEntry,
  DailyBalanceEntryDocument,
} from './schemas/daily-balance-entry.schema';
import {
  MainBalance,
  MainBalanceDocument,
  MainBalanceTransfer,
  MainBalanceTransferDocument,
} from './schemas/main-balance.schema';
import {
  getTodayDateKey,
  roundMoney,
} from './utils/daily-balance.utils';

@Injectable()
export class DailyBalancesService implements OnModuleInit {
  constructor(
    @InjectModel(DailyBalance.name)
    private readonly dailyBalanceModel: Model<DailyBalanceDocument>,
    @InjectModel(DailyBalanceEntry.name)
    private readonly entryModel: Model<DailyBalanceEntryDocument>,
    @InjectModel(MainBalance.name)
    private readonly mainBalanceModel: Model<MainBalanceDocument>,
    @InjectModel(MainBalanceTransfer.name)
    private readonly transferModel: Model<MainBalanceTransferDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(PaymentType.name)
    private readonly paymentTypeModel: Model<PaymentTypeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  async onModuleInit() {
    await this.ensureMainBalance();
    await this.ensureTodayForAllWarehouses();
  }

  async findAll(query: DailyBalanceQueryDto, scope?: UserWarehouseScope) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const filter = this.buildListFilter(query, scope);
    if (!filter) {
      return {
        data: [],
        meta: emptyPaginatedMeta(page, perPage),
      };
    }

    await this.ensureTodayForAllWarehouses();

    const [items, total] = await Promise.all([
      this.dailyBalanceModel
        .find(filter)
        .populate('warehouseId', 'name')
        .sort({ dateKey: -1, createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.dailyBalanceModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toDailyBalanceResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  private buildListFilter(
    query: DailyBalanceQueryDto,
    scope?: UserWarehouseScope,
  ): Record<string, unknown> | null {
    const and: Array<Record<string, unknown>> = [];

    const idFilter = buildIdFilter(query.id);
    if (idFilter) and.push(idFilter);

    const dateFilter = parseDateKeyFilter(query.dateKey);
    if (dateFilter) {
      and.push({ dateKey: dateFilter });
    }

    if (query.status) {
      and.push({ status: query.status });
    }

    if (query.warehouseId) {
      ensureWarehouseAllowed(scope, query.warehouseId);
      and.push({ warehouseId: new Types.ObjectId(query.warehouseId) });
    } else if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return null;
      }
      and.push({
        warehouseId: {
          $in: scope.warehouseIds.map((id) => new Types.ObjectId(id)),
        },
      });
    }

    if (query.income !== undefined && !Number.isNaN(query.income)) {
      and.push({
        $expr: {
          $and: [
            {
              $gte: [
                this.incomeSumExpression(),
                roundMoney(query.income - 0.01),
              ],
            },
            {
              $lte: [
                this.incomeSumExpression(),
                roundMoney(query.income + 0.01),
              ],
            },
          ],
        },
      });
    }

    if (query.expense !== undefined && !Number.isNaN(query.expense)) {
      and.push({
        expenseTotal: {
          $gte: roundMoney(query.expense - 0.01),
          $lte: roundMoney(query.expense + 0.01),
        },
      });
    }

    if (
      query.transferredToMain !== undefined &&
      !Number.isNaN(query.transferredToMain)
    ) {
      and.push({
        transferredToMain: {
          $gte: roundMoney(query.transferredToMain - 0.01),
          $lte: roundMoney(query.transferredToMain + 0.01),
        },
      });
    }

    const savedAtFilter = parseCreatedAtFilter(query.savedAt);
    if (savedAtFilter) {
      and.push({ updatedAt: savedAtFilter });
    }

    if (and.length === 0) {
      return {};
    }

    return { $and: and };
  }

  private incomeSumExpression() {
    return {
      $add: [
        '$salesCash',
        '$salesTerminal',
        '$salesCard',
        '$manualIncomeCash',
        '$manualIncomeTerminal',
        '$manualIncomeCard',
      ],
    };
  }

  async findById(id: string, scope?: UserWarehouseScope) {
    const balance = await this.findBalanceDocument(id, scope);
    const entries = await this.entryModel
      .find({ dailyBalanceId: balance._id })
      .sort({ createdAt: -1 })
      .exec();

    return toDailyBalanceDetailResponse(balance, entries);
  }

  async getMainBalance(_scope?: UserWarehouseScope) {
    const mainBalance = await this.ensureMainBalance();
    return { total: roundMoney(mainBalance.total) };
  }

  async findEntries(
    query: { type?: string; page?: number; perPage?: number },
    scope?: UserWarehouseScope,
  ) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const balanceFilter: Record<string, unknown> = {};
    if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return {
          data: [],
          meta: emptyPaginatedMeta(page, perPage),
        };
      }
      balanceFilter.warehouseId = {
        $in: scope.warehouseIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const balances = await this.dailyBalanceModel
      .find(balanceFilter)
      .populate('warehouseId', 'name')
      .select('_id dateKey warehouseId')
      .exec();
    const balanceById = new Map(
      balances.map((balance) => [balance._id.toString(), balance]),
    );

    const entryFilter: Record<string, unknown> = {
      dailyBalanceId: { $in: balances.map((balance) => balance._id) },
    };
    if (query.type) {
      entryFilter.type = query.type;
    }

    const [items, total] = await Promise.all([
      this.entryModel
        .find(entryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.entryModel.countDocuments(entryFilter),
    ]);

    return {
      data: items.map((entry) => {
        const balance = balanceById.get(entry.dailyBalanceId.toString());
        const warehouse = balance?.warehouseId as
          | { _id: { toString(): string }; name: string }
          | undefined;
        return {
          ...toDailyBalanceEntryResponse(entry),
          dailyBalanceId: entry.dailyBalanceId.toString(),
          dateKey: balance?.dateKey ?? '',
          warehouseId: warehouse?._id?.toString() ?? '',
          warehouseName: warehouse?.name ?? '',
        };
      }),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async getTransferHistory(
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    scope?: UserWarehouseScope,
  ) {
    const skip = (page - 1) * perPage;
    const filter: Record<string, unknown> = {};

    if (scope && !scope.allWarehouses) {
      if (scope.warehouseIds.length === 0) {
        return {
          data: [],
          meta: emptyPaginatedMeta(page, perPage),
        };
      }
      filter.warehouseId = {
        $in: scope.warehouseIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const [items, total] = await Promise.all([
      this.transferModel
        .find(filter)
        .populate('warehouseId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.transferModel.countDocuments(filter),
    ]);

    return {
      data: items.map((item) => toMainBalanceTransferResponse(item)),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async ensureToday(warehouseId: string) {
    await this.closeExpiredOpenBalances();
    return this.getOrCreateOpenBalance(warehouseId, getTodayDateKey());
  }

  async addManualIncome(
    balanceId: string,
    dto: AddManualIncomeDto,
    userId?: string,
    scope?: UserWarehouseScope,
  ) {
    const balance = await this.findBalanceDocument(balanceId, scope);
    this.ensureBalanceOpen(balance);

    if (!['cash', 'terminal', 'card'].includes(dto.channel)) {
      throw new BadRequestException(
        'Kirim uchun naqd, terminal yoki karta tanlang',
      );
    }

    const amount = roundMoney(dto.amount);
    const channel = dto.channel as PaymentChannel;

    await this.entryModel.create({
      dailyBalanceId: balance._id,
      type: 'manual_income',
      channel,
      amount,
      note: dto.note?.trim() ?? '',
      createdById: userId ? new Types.ObjectId(userId) : undefined,
    });

    if (channel === 'cash') {
      balance.manualIncomeCash = roundMoney(balance.manualIncomeCash + amount);
    } else if (channel === 'terminal') {
      balance.manualIncomeTerminal = roundMoney(
        balance.manualIncomeTerminal + amount,
      );
    } else {
      balance.manualIncomeCard = roundMoney(balance.manualIncomeCard + amount);
    }

    await balance.save();
    return this.findById(balance._id.toString(), scope);
  }

  async addExpense(
    balanceId: string,
    dto: AddExpenseDto,
    userId?: string,
    scope?: UserWarehouseScope,
  ) {
    const balance = await this.findBalanceDocument(balanceId, scope);
    this.ensureBalanceOpen(balance);

    const amount = roundMoney(dto.amount);

    await this.deductMainBalance(
      amount,
      'Asosiy balansda yetarli mablag\' yo\'q. Avval asosiy balansga pul qo\'shing.',
    );

    const { category, parent } =
      await this.expenseCategoriesService.findLeafCategory(dto.expenseCategoryId);

    await this.entryModel.create({
      dailyBalanceId: balance._id,
      type: 'expense',
      amount,
      note: dto.note?.trim() ?? '',
      expenseCategoryId: category._id,
      expenseCategoryName: `${parent.name} · ${category.name}`,
      createdById: userId ? new Types.ObjectId(userId) : undefined,
    });

    balance.expenseTotal = roundMoney(balance.expenseTotal + amount);
    await balance.save();
    return this.findById(balance._id.toString(), scope);
  }

  async depositCashToMain(
    balanceId: string,
    dto: AddCashToMainDto,
    userId?: string,
    scope?: UserWarehouseScope,
  ) {
    const balance = await this.findBalanceDocument(balanceId, scope);
    this.ensureBalanceOpen(balance);

    const amount = roundMoney(dto.amount);
    const availableCash = this.getAvailableCashForDeposit(balance);

    if (amount > availableCash) {
      throw new BadRequestException(
        `Bugungi naqd pul yetarli emas. Mavjud: ${availableCash}`,
      );
    }

    const mainBalance = await this.ensureMainBalance();
    const before = roundMoney(mainBalance.total);
    const after = roundMoney(before + amount);

    mainBalance.total = after;
    await mainBalance.save();

    await this.transferModel.create({
      dailyBalanceId: balance._id,
      warehouseId: balance.warehouseId,
      dateKey: balance.dateKey,
      amount,
      mainBalanceBefore: before,
      mainBalanceAfter: after,
    });

    await this.entryModel.create({
      dailyBalanceId: balance._id,
      type: 'cash_to_main',
      channel: 'cash',
      amount,
      note: dto.note?.trim() ?? 'Asosiy balansga naqd pul',
      createdById: userId ? new Types.ObjectId(userId) : undefined,
    });

    balance.transferredToMain = roundMoney(balance.transferredToMain + amount);
    await balance.save();

    return this.findById(balance._id.toString(), scope);
  }

  async closeDay(balanceId: string, scope?: UserWarehouseScope) {
    const balance = await this.findBalanceDocument(balanceId, scope);
    return this.closeBalance(balance);
  }

  async recordOrderSale(orderId: string) {
    const existing = await this.entryModel
      .findOne({ orderId: new Types.ObjectId(orderId), type: 'sale' })
      .exec();
    if (existing) {
      return;
    }

    const order = await this.orderModel.findById(orderId).exec();
    if (!order || order.status !== 'confirmed') {
      return;
    }

    const warehouseId = order.warehouseId
      ? order.warehouseId.toString()
      : await this.resolveWarehouseIdForOrder(order);
    if (!warehouseId) {
      return;
    }

    await this.closeExpiredOpenBalances();
    const balance = await this.getOrCreateOpenBalance(
      warehouseId,
      getTodayDateKey(),
    );

    const paymentTypeIds = order.payments.map((payment) =>
      payment.paymentTypeId.toString(),
    );
    const paymentTypes = await this.paymentTypeModel
      .find({ _id: { $in: paymentTypeIds } })
      .exec();
    const channelByPaymentTypeId = new Map(
      paymentTypes.map((paymentType) => [
        paymentType._id.toString(),
        paymentType.channel ?? inferPaymentChannel(paymentType.name),
      ]),
    );

    let salesCash = 0;
    let salesTerminal = 0;
    let salesCard = 0;

    for (const payment of order.payments) {
      const channel =
        channelByPaymentTypeId.get(payment.paymentTypeId.toString()) ??
        inferPaymentChannel(payment.paymentTypeName);
      const amount = roundMoney(payment.amount);

      if (channel === 'cash') {
        salesCash += amount;
      } else if (channel === 'terminal') {
        salesTerminal += amount;
      } else if (channel === 'card') {
        salesCard += amount;
      } else {
        salesCash += amount;
      }

      await this.entryModel.create({
        dailyBalanceId: balance._id,
        type: 'sale',
        channel: channel === 'other' ? 'cash' : channel,
        amount,
        note: payment.paymentTypeName,
        orderId: order._id,
        orderLabel: `#${order._id.toString().slice(-4).toUpperCase()}`,
        createdById: order.createdById,
      });
    }

    balance.salesCash = roundMoney(balance.salesCash + salesCash);
    balance.salesTerminal = roundMoney(balance.salesTerminal + salesTerminal);
    balance.salesCard = roundMoney(balance.salesCard + salesCard);
    await balance.save();
  }

  private async closeExpiredOpenBalances() {
    const todayKey = getTodayDateKey();
    const openBalances = await this.dailyBalanceModel
      .find({ status: 'open', dateKey: { $lt: todayKey } })
      .exec();

    for (const balance of openBalances) {
      await this.closeBalance(balance);
    }
  }

  private async closeBalance(balance: DailyBalanceDocument) {
    if (balance.status === 'closed') {
      return toDailyBalanceResponse(balance);
    }

    balance.status = 'closed';
    balance.closedAt = new Date();
    await balance.save();

    return toDailyBalanceResponse(balance);
  }

  private async getOrCreateOpenBalance(warehouseId: string, dateKey: string) {
    const warehouseObjectId = new Types.ObjectId(warehouseId);
    let balance = await this.dailyBalanceModel
      .findOne({ warehouseId: warehouseObjectId, dateKey })
      .populate('warehouseId', 'name')
      .exec();

    if (!balance) {
      balance = await this.dailyBalanceModel.create({
        dateKey,
        warehouseId: warehouseObjectId,
        status: 'open',
      });
      balance = await this.dailyBalanceModel
        .findById(balance._id)
        .populate('warehouseId', 'name')
        .exec();
    }

    if (!balance) {
      throw new NotFoundException('Kunlik balans topilmadi');
    }

    return balance;
  }

  private async ensureTodayForAllWarehouses() {
    await this.closeExpiredOpenBalances();

    const warehouses = await this.warehouseModel
      .find({ isActive: true })
      .select('_id')
      .exec();
    const todayKey = getTodayDateKey();

    for (const warehouse of warehouses) {
      await this.getOrCreateOpenBalance(warehouse._id.toString(), todayKey);
    }
  }

  private async ensureMainBalance() {
    let mainBalance = await this.mainBalanceModel.findOne().exec();
    if (!mainBalance) {
      mainBalance = await this.mainBalanceModel.create({ total: 0 });
    }
    return mainBalance;
  }

  private async resolveWarehouseIdForOrder(
    order: OrderDocument,
  ): Promise<string | null> {
    if (order.createdById) {
      const user = await this.userModel.findById(order.createdById).exec();
      if (user?.warehouseIds?.length) {
        return user.warehouseIds[0].toString();
      }
    }

    const warehouse = await this.warehouseModel
      .findOne({ isActive: true })
      .sort({ createdAt: 1 })
      .exec();
    return warehouse?._id.toString() ?? null;
  }

  private async findBalanceDocument(
    id: string,
    scope?: UserWarehouseScope,
  ) {
    const balance = await this.dailyBalanceModel
      .findById(id)
      .populate('warehouseId', 'name')
      .exec();
    if (!balance) {
      throw new NotFoundException('Kunlik balans topilmadi');
    }
    ensureWarehouseAllowed(scope, balance.warehouseId);
    return balance;
  }

  private ensureBalanceOpen(balance: DailyBalanceDocument) {
    if (balance.status !== 'open') {
      throw new BadRequestException('Yopilgan kunlik balansga yozib bo\'lmaydi');
    }
  }

  private getAvailableCashForDeposit(balance: DailyBalanceDocument) {
    const todayCash = roundMoney(balance.salesCash + balance.manualIncomeCash);
    return Math.max(0, roundMoney(todayCash - balance.transferredToMain));
  }

  private async deductMainBalance(amount: number, message: string) {
    const mainBalance = await this.ensureMainBalance();
    if (mainBalance.total < amount) {
      throw new BadRequestException(message);
    }

    mainBalance.total = roundMoney(mainBalance.total - amount);
    await mainBalance.save();
  }
}
