import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateExpenseCategoryDto } from '../daily-balances/dto/daily-balance.dto';
import {
  toExpenseCategoryGroupResponse,
  toExpenseCategoryResponse,
} from '../daily-balances/daily-balances.mapper';
import { DailyBalanceEntry, DailyBalanceEntryDocument } from '../daily-balances/schemas/daily-balance-entry.schema';
import { EXPENSE_CATEGORY_TREE } from './constants/expense-category-tree';
import {
  ExpenseCategory,
  ExpenseCategoryDocument,
} from './schemas/expense-category.schema';

@Injectable()
export class ExpenseCategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(ExpenseCategory.name)
    private readonly expenseCategoryModel: Model<ExpenseCategoryDocument>,
    @InjectModel(DailyBalanceEntry.name)
    private readonly dailyBalanceEntryModel: Model<DailyBalanceEntryDocument>,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
  }

  async findAll(activeOnly = true) {
    const filter = activeOnly ? { isActive: true } : {};
    const items = await this.expenseCategoryModel
      .find(filter)
      .sort({ name: 1 })
      .exec();

    const parents = items.filter((item) => !item.parentId);
    const childrenByParentId = new Map<string, ExpenseCategoryDocument[]>();

    for (const item of items) {
      if (!item.parentId) continue;
      const parentKey = item.parentId.toString();
      const bucket = childrenByParentId.get(parentKey) ?? [];
      bucket.push(item);
      childrenByParentId.set(parentKey, bucket);
    }

    const usageCounts = await this.loadUsageCounts();

    return parents
      .map((parent) => {
        const children = (childrenByParentId.get(parent._id.toString()) ?? [])
          .sort((a, b) => a.name.localeCompare(b.name, 'uz'))
          .map((child) =>
            toExpenseCategoryResponse(
              child,
              usageCounts.get(child._id.toString()) ?? 0,
            ),
          );

        return toExpenseCategoryGroupResponse(parent, children);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'uz'));
  }

  private async loadUsageCounts() {
    const rows = await this.dailyBalanceEntryModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            type: 'expense',
            expenseCategoryId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$expenseCategoryId',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }

  async create(dto: CreateExpenseCategoryDto) {
    const name = dto.name.trim();
    const parentId = dto.parentId
      ? new Types.ObjectId(dto.parentId)
      : null;

    if (parentId) {
      const parent = await this.expenseCategoryModel.findById(parentId).exec();
      if (!parent || !parent.isActive || parent.parentId) {
        throw new NotFoundException('Asosiy xarajat turi topilmadi');
      }
    }

    const existing = await this.expenseCategoryModel
      .findOne({ name, parentId })
      .exec();
    if (existing) {
      throw new ConflictException('Bu xarajat turi allaqachon mavjud');
    }

    const category = await this.expenseCategoryModel.create({
      name,
      parentId,
      isActive: true,
    });
    return toExpenseCategoryResponse(category);
  }

  async deactivate(id: string) {
    const category = await this.expenseCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Xarajat turi topilmadi');
    }

    if (!category.parentId) {
      const childExists = await this.expenseCategoryModel
        .exists({ parentId: category._id, isActive: true })
        .exec();
      if (childExists) {
        throw new ConflictException(
          'Avval ichki xarajat turlarini o\'chiring',
        );
      }
    } else {
      const usageCount = await this.dailyBalanceEntryModel.countDocuments({
        type: 'expense',
        expenseCategoryId: category._id,
      });
      if (usageCount > 0) {
        throw new ConflictException(
          'Bu xarajat turi tranzaksiyada ishlatilgan. O\'chirib bo\'lmaydi',
        );
      }
    }

    category.isActive = false;
    await category.save();
    return toExpenseCategoryResponse(category);
  }

  private async seedCategories() {
    for (const group of EXPENSE_CATEGORY_TREE) {
      let parent = await this.expenseCategoryModel
        .findOne({ name: group.name, parentId: null })
        .exec();

      if (!parent) {
        parent = await this.expenseCategoryModel.create({
          name: group.name,
          parentId: null,
          isActive: true,
        });
      } else if (!parent.isActive) {
        parent.isActive = true;
        await parent.save();
      }

      for (const childName of group.children) {
        const existingChild = await this.expenseCategoryModel
          .findOne({
            name: childName,
            parentId: parent._id,
          })
          .exec();

        if (!existingChild) {
          try {
            await this.expenseCategoryModel.create({
              name: childName,
              parentId: parent._id,
              isActive: true,
            });
          } catch (error) {
            const code = (error as { code?: number }).code;
            if (code !== 11_000) {
              throw error;
            }
          }
          continue;
        }

        if (!existingChild.isActive) {
          existingChild.isActive = true;
          await existingChild.save();
        }
      }
    }

    await this.migrateLegacyRootCategories();
  }

  private async migrateLegacyRootCategories() {
    const treeParentNames = new Set(
      EXPENSE_CATEGORY_TREE.map((group) => group.name),
    );
    const legacyRoots = await this.expenseCategoryModel
      .find({
        parentId: null,
        name: { $nin: [...treeParentNames] },
      })
      .exec();

    for (const legacyRoot of legacyRoots) {
      const childExists = await this.expenseCategoryModel
        .exists({ parentId: legacyRoot._id })
        .exec();
      if (childExists) continue;

      try {
        await this.expenseCategoryModel.create({
          name: 'Boshqa',
          parentId: legacyRoot._id,
          isActive: true,
        });
      } catch (error) {
        const code = (error as { code?: number }).code;
        if (code !== 11_000) {
          throw error;
        }
      }
    }
  }

  async findLeafCategory(id: string) {
    const category = await this.expenseCategoryModel.findById(id).exec();
    if (!category || !category.isActive) {
      throw new NotFoundException('Xarajat turi topilmadi');
    }

    if (!category.parentId) {
      throw new NotFoundException('Xarajat turini tanlang');
    }

    const parent = await this.expenseCategoryModel
      .findById(category.parentId)
      .exec();
    if (!parent || !parent.isActive) {
      throw new NotFoundException('Asosiy xarajat turi topilmadi');
    }

    return { category, parent };
  }
}
