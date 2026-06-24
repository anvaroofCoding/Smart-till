import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { escapeRegex, buildIdFilter } from '../common/utils/list-filter.utils';
import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
} from '../stock-movements/schemas/stock-movement.schema';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';
import {
  emptyPaginatedMeta,
  isWarehouseAllowed,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import { WarehouseStockQueryDto } from './dto/warehouse-stock-query.dto';
import {
  toWarehouseStockDetail,
  toWarehouseStockListItem,
  buildLatestMovementKey,
} from './warehouse-stock.mapper';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from './schemas/warehouse-stock.schema';
import { PriceSettingsService } from '../price-settings/price-settings.service';
import { buildSellingPriceKey } from '../price-settings/utils/resolve-selling-price';

@Injectable()
export class WarehouseStockService {
  constructor(
    @InjectModel(WarehouseStock.name)
    private readonly stockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    private readonly priceSettingsService: PriceSettingsService,
  ) {}

  async findAll(query: WarehouseStockQueryDto, scope?: UserWarehouseScope) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    if (scope && !scope.allWarehouses && scope.warehouseIds.length === 0) {
      return {
        data: [],
        meta: emptyPaginatedMeta(page, perPage),
      };
    }

    const filter = await this.buildListFilter(query, scope);
    const needsSellingPriceFilter =
      query.sellingPrice !== undefined && !Number.isNaN(query.sellingPrice);

    if (needsSellingPriceFilter) {
      const items = await this.stockModel
        .find(filter)
        .populate({
          path: 'productId',
          select: 'name code categoryId brandId',
          populate: [
            { path: 'categoryId', select: 'name' },
            { path: 'brandId', select: 'name' },
          ],
        })
        .populate('warehouseId', 'name')
        .sort({ quantity: -1, updatedAt: -1 })
        .exec();

      const allData = (await this.mapStockItemsToListData(items)).filter(
        (item) =>
          Math.abs(item.sellingPrice - query.sellingPrice!) <= 0.01,
      );

      const total = allData.length;

      return {
        data: allData.slice(skip, skip + perPage),
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage) || 1,
        },
      };
    }

    const [items, total] = await Promise.all([
      this.stockModel
        .find(filter)
        .populate({
          path: 'productId',
          select: 'name code categoryId brandId',
          populate: [
            { path: 'categoryId', select: 'name' },
            { path: 'brandId', select: 'name' },
          ],
        })
        .populate('warehouseId', 'name')
        .sort({ quantity: -1, updatedAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.stockModel.countDocuments(filter),
    ]);

    return {
      data: await this.mapStockItemsToListData(items),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  private async mapStockItemsToListData(stocks: WarehouseStockDocument[]) {
    const latestMovements = await this.loadLatestMovements(stocks);
    const sellingPrices = await this.resolveSellingPrices(stocks, latestMovements);

    return stocks.map((item) =>
      toWarehouseStockListItem(
        item,
        latestMovements.get(
          buildLatestMovementKey(item.warehouseId, item.productId),
        ),
        sellingPrices.get(
          buildSellingPriceKey(
            this.extractWarehouseId(item.warehouseId),
            this.extractProductId(item.productId),
          ),
        ),
      ),
    );
  }

  async findById(id: string, scope?: UserWarehouseScope) {
    const stock = await this.stockModel
      .findById(id)
      .populate({
        path: 'productId',
        select: 'name code categoryId brandId',
        populate: [
          { path: 'categoryId', select: 'name' },
          { path: 'brandId', select: 'name' },
        ],
      })
      .populate('warehouseId', 'name')
      .exec();

    if (!stock) {
      throw new NotFoundException('Ombordagi maxsulot topilmadi');
    }

    this.ensureWarehouseAllowed(scope, stock.warehouseId);

    const movements = await this.movementModel
      .find({
        warehouseId: stock.warehouseId,
        productId: stock.productId,
      })
      .populate('supplierId', 'name')
      .populate('warehouseId', 'name')
      .sort({ createdAt: -1 })
      .exec();

    const latestMovements = await this.loadLatestMovements([stock]);
    const sellingPrices = await this.resolveSellingPrices(stock, latestMovements);
    const sellingPrice = sellingPrices.get(
      buildSellingPriceKey(
        this.extractWarehouseId(stock.warehouseId),
        this.extractProductId(stock.productId),
      ),
    );

    return toWarehouseStockDetail(stock, movements, sellingPrice);
  }

  private extractProductId(product: unknown): string {
    if (product && typeof product === 'object' && '_id' in product) {
      return (product as { _id: Types.ObjectId })._id.toString();
    }

    return (product as Types.ObjectId).toString();
  }

  private extractWarehouseId(warehouse: unknown): string {
    if (warehouse && typeof warehouse === 'object' && '_id' in warehouse) {
      return (warehouse as { _id: Types.ObjectId })._id.toString();
    }

    return (warehouse as Types.ObjectId).toString();
  }

  private extractRelationId(value: unknown): string {
    if (value && typeof value === 'object' && '_id' in value) {
      return (value as { _id: Types.ObjectId })._id.toString();
    }

    return (value as Types.ObjectId).toString();
  }

  private async resolveSellingPrices(
    stocks: WarehouseStockDocument | WarehouseStockDocument[],
    latestMovements: Map<string, StockMovementDocument>,
  ) {
    const items = Array.isArray(stocks) ? stocks : [stocks];

    const contexts = items
      .map((stock) => {
        const product = stock.productId;
        if (!product || typeof product !== 'object' || !('_id' in product)) {
          return null;
        }

        const latestMovement = latestMovements.get(
          buildLatestMovementKey(stock.warehouseId, stock.productId),
        );
        const unitPrice = latestMovement?.unitPrice ?? stock.lastUnitPrice ?? 0;

        return {
          warehouseId: this.extractWarehouseId(stock.warehouseId),
          productId: this.extractProductId(product),
          categoryId: this.extractRelationId(
            (product as unknown as { categoryId: unknown }).categoryId,
          ),
          brandId: this.extractRelationId(
            (product as unknown as { brandId: unknown }).brandId,
          ),
          costPrice: unitPrice,
        };
      })
      .filter((context): context is NonNullable<typeof context> => context !== null);

    return this.priceSettingsService.resolveSellingPricesForContexts(contexts);
  }

  private async buildListFilter(
    query: WarehouseStockQueryDto,
    scope?: UserWarehouseScope,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};
    const and: Array<Record<string, unknown>> = [{ quantity: { $gt: 0 } }];

    const idFilter = buildIdFilter(query.id);
    if (idFilter) and.push(idFilter);

    if (scope && !scope.allWarehouses) {
      and.push({ warehouseId: { $in: scope.warehouseIds } });
    }

    if (query.warehouseId) {
      and.push({ warehouseId: new Types.ObjectId(query.warehouseId) });
    } else if (query.warehouseName?.trim()) {
      const warehouses = await this.warehouseModel
        .find({
          name: new RegExp(escapeRegex(query.warehouseName.trim()), 'i'),
        })
        .select('_id')
        .exec();

      and.push({
        warehouseId: {
          $in: warehouses.map((warehouse) => warehouse._id),
        },
      });
    }

    const productFilter = await this.buildProductFilter(query);
    if (productFilter) {
      and.push({ productId: productFilter });
    }

    if (query.unitPrice !== undefined && !Number.isNaN(query.unitPrice)) {
      and.push({
        lastUnitPrice: {
          $gte: query.unitPrice - 0.01,
          $lte: query.unitPrice + 0.01,
        },
      });
    }

    if (query.quantity !== undefined && !Number.isNaN(query.quantity)) {
      and.push({
        quantity: {
          $gte: query.quantity - 0.001,
          $lte: query.quantity + 0.001,
        },
      });
    }

    if (query.totalValue !== undefined && !Number.isNaN(query.totalValue)) {
      and.push({
        $expr: {
          $let: {
            vars: {
              total: {
                $multiply: ['$quantity', '$lastUnitPrice'],
              },
            },
            in: {
              $and: [
                { $gte: ['$$total', query.totalValue! - 0.01] },
                { $lte: ['$$total', query.totalValue! + 0.01] },
              ],
            },
          },
        },
      });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    return filter;
  }

  private async buildProductFilter(
    query: WarehouseStockQueryDto,
  ): Promise<Types.ObjectId | { $in: Types.ObjectId[] } | null> {
    if (query.productId) {
      return new Types.ObjectId(query.productId);
    }

    const productAnd: Array<Record<string, unknown>> = [];

    if (query.categoryId) {
      productAnd.push({ categoryId: new Types.ObjectId(query.categoryId) });
    }

    if (query.brandId) {
      productAnd.push({ brandId: new Types.ObjectId(query.brandId) });
    }

    if (query.productName?.trim()) {
      productAnd.push({
        name: new RegExp(escapeRegex(query.productName.trim()), 'i'),
      });
    }

    if (productAnd.length === 0) {
      return null;
    }

    const products = await this.productModel
      .find(productAnd.length === 1 ? productAnd[0] : { $and: productAnd })
      .select('_id')
      .exec();

    return { $in: products.map((product) => product._id) };
  }

  private async loadLatestMovements(stocks: WarehouseStockDocument[]) {
    const map = new Map<string, StockMovementDocument>();

    if (stocks.length === 0) {
      return map;
    }

    const pairs = stocks.map((stock) => ({
      warehouseId: stock.warehouseId,
      productId: stock.productId,
    }));

    const latestRows = await this.movementModel
      .aggregate<{
        _id: { warehouseId: Types.ObjectId; productId: Types.ObjectId };
        doc: StockMovementDocument;
      }>([
        { $match: { $or: pairs } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { warehouseId: '$warehouseId', productId: '$productId' },
            doc: { $first: '$$ROOT' },
          },
        },
      ])
      .exec();

    for (const row of latestRows) {
      map.set(
        buildLatestMovementKey(row._id.warehouseId, row._id.productId),
        row.doc,
      );
    }

    return map;
  }

  private ensureWarehouseAllowed(
    scope: UserWarehouseScope | undefined,
    warehouseId: unknown,
  ): void {
    if (!isWarehouseAllowed(scope, warehouseId)) {
      throw new ForbiddenException('Bu omborga kirish huquqi yo\'q');
    }
  }
}
