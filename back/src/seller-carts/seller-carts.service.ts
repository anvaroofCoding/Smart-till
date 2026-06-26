import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ensureWarehouseAllowed,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import { OrdersService } from '../orders/orders.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  AddSellerCartItemDto,
  UpdateSellerCartItemDto,
} from './dto/seller-cart.dto';
import { toSellerCartResponse } from './seller-carts.mapper';
import {
  SellerCart,
  SellerCartDocument,
} from './schemas/seller-cart.schema';

@Injectable()
export class SellerCartsService {
  constructor(
    @InjectModel(SellerCart.name)
    private readonly sellerCartModel: Model<SellerCartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly ordersService: OrdersService,
  ) {}

  async findMine(sellerId: string) {
    const carts = await this.sellerCartModel
      .find({ sellerId, status: 'active' })
      .sort({ updatedAt: -1 })
      .exec();

    const sellerName = await this.loadSellerName(sellerId);

    return {
      data: carts.map((cart) => toSellerCartResponse(cart, sellerName)),
    };
  }

  async findActiveByCardNumber(cardNumber: string) {
    const normalized = this.normalizeCardNumber(cardNumber);
    const cart = await this.sellerCartModel
      .findOne({ cardNumber: normalized, status: 'active' })
      .exec();

    if (!cart) {
      throw new NotFoundException('Bu karta raqamida faol buyurtma topilmadi');
    }

    const sellerName = await this.loadSellerName(cart.sellerId.toString());
    return toSellerCartResponse(cart, sellerName);
  }

  async reserveCard(
    cardNumber: string,
    sellerId: string,
    scope?: UserWarehouseScope,
  ) {
    const normalized = this.normalizeCardNumber(cardNumber);
    const existing = await this.sellerCartModel
      .findOne({ cardNumber: normalized, status: 'active' })
      .exec();

    if (existing) {
      if (existing.sellerId.toString() !== sellerId) {
        throw new ConflictException(
          'Bu karta raqami boshqa sotuvchi tomonidan band',
        );
      }

      const sellerName = await this.loadSellerName(sellerId);
      return toSellerCartResponse(existing, sellerName);
    }

    const warehouseId = await this.resolveWarehouseIdForUser(sellerId, scope);
    const cart = await this.sellerCartModel.create({
      cardNumber: normalized,
      sellerId: new Types.ObjectId(sellerId),
      warehouseId,
      items: [],
      status: 'active',
    });

    const sellerName = await this.loadSellerName(sellerId);
    return toSellerCartResponse(cart, sellerName);
  }

  async addItem(
    cardNumber: string,
    dto: AddSellerCartItemDto,
    sellerId: string,
    scope?: UserWarehouseScope,
  ) {
    const cart = await this.ensureOwnedCart(cardNumber, sellerId, scope);
    await this.ensureProductExists(dto.productId);

    const quantity = dto.quantity ?? 1;
    const lineTotal = dto.unitPrice * quantity;
    const productObjectId = new Types.ObjectId(dto.productId);
    const existingItem = cart.items.find((item) =>
      item.productId.equals(productObjectId),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.unitPrice = dto.unitPrice;
      existingItem.productName = dto.productName.trim();
      existingItem.productCode = dto.productCode?.trim() ?? '';
      existingItem.lineTotal = existingItem.unitPrice * existingItem.quantity;
    } else {
      cart.items.push({
        productId: productObjectId,
        productName: dto.productName.trim(),
        productCode: dto.productCode?.trim() ?? '',
        unitPrice: dto.unitPrice,
        quantity,
        lineTotal,
      });
    }

    await cart.save();
    const sellerName = await this.loadSellerName(sellerId);
    return toSellerCartResponse(cart, sellerName);
  }

  async updateItemQuantity(
    cardNumber: string,
    productId: string,
    dto: UpdateSellerCartItemDto,
    sellerId: string,
    scope?: UserWarehouseScope,
  ) {
    const cart = await this.ensureOwnedCart(cardNumber, sellerId, scope);
    const item = cart.items.find((entry) =>
      entry.productId.equals(new Types.ObjectId(productId)),
    );

    if (!item) {
      throw new NotFoundException('Maxsulot karta ro\'yxatida topilmadi');
    }

    item.quantity = dto.quantity;
    item.lineTotal = item.unitPrice * item.quantity;
    await cart.save();

    const sellerName = await this.loadSellerName(sellerId);
    return toSellerCartResponse(cart, sellerName);
  }

  async removeItem(
    cardNumber: string,
    productId: string,
    sellerId: string,
    scope?: UserWarehouseScope,
  ) {
    const cart = await this.ensureOwnedCart(cardNumber, sellerId, scope);
    const nextItems = cart.items.filter(
      (entry) => !entry.productId.equals(new Types.ObjectId(productId)),
    );

    if (nextItems.length === cart.items.length) {
      throw new NotFoundException('Maxsulot karta ro\'yxatida topilmadi');
    }

    cart.items = nextItems;
    await cart.save();

    const sellerName = await this.loadSellerName(sellerId);
    return toSellerCartResponse(cart, sellerName);
  }

  async claim(
    cardNumber: string,
    userId: string,
    scope?: UserWarehouseScope,
  ) {
    const normalized = this.normalizeCardNumber(cardNumber);
    const cart = await this.sellerCartModel
      .findOne({ cardNumber: normalized, status: 'active' })
      .exec();

    if (!cart) {
      throw new NotFoundException('Bu karta raqamida faol buyurtma topilmadi');
    }

    if (!cart.items.length) {
      throw new BadRequestException('Karta ro\'yxati bo\'sh');
    }

    const order = await this.ordersService.createDraft(
      {
        items: cart.items.map((item) => ({
          productId: item.productId.toString(),
          productName: item.productName,
          productCode: item.productCode,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: 0,
          lineTotal: item.lineTotal,
        })),
      },
      userId,
      scope,
    );

    cart.status = 'claimed';
    cart.claimedOrderId = order._id;
    await cart.save();

    return this.ordersService.findByIdResponse(order._id.toString(), scope);
  }

  private async ensureOwnedCart(
    cardNumber: string,
    sellerId: string,
    scope?: UserWarehouseScope,
  ): Promise<SellerCartDocument> {
    const normalized = this.normalizeCardNumber(cardNumber);
    let cart = await this.sellerCartModel
      .findOne({ cardNumber: normalized, status: 'active' })
      .exec();

    if (!cart) {
      const warehouseId = await this.resolveWarehouseIdForUser(sellerId, scope);
      cart = await this.sellerCartModel.create({
        cardNumber: normalized,
        sellerId: new Types.ObjectId(sellerId),
        warehouseId,
        items: [],
        status: 'active',
      });
      return cart;
    }

    if (cart.sellerId.toString() !== sellerId) {
      throw new ConflictException(
        'Bu karta raqami boshqa sotuvchi tomonidan band',
      );
    }

    return cart;
  }

  private normalizeCardNumber(cardNumber: string): string {
    const normalized = cardNumber.trim();
    if (!normalized) {
      throw new BadRequestException('Karta raqamini kiriting');
    }
    if (normalized.length > 20) {
      throw new BadRequestException(
        'Karta raqami 20 belgidan oshmasligi kerak',
      );
    }
    return normalized;
  }

  private async ensureProductExists(productId: string) {
    const product = await this.productModel.findById(productId).exec();
    if (!product || !product.isActive) {
      throw new NotFoundException('Maxsulot topilmadi');
    }
  }

  private async loadSellerName(sellerId: string): Promise<string> {
    const user = await this.userModel.findById(sellerId).exec();
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async resolveWarehouseIdForUser(
    userId: string,
    scope?: UserWarehouseScope,
  ): Promise<Types.ObjectId | undefined> {
    const user = await this.userModel.findById(userId).exec();
    if (!user?.warehouseIds?.length) {
      return undefined;
    }

    const primaryWarehouseId = user.warehouseIds[0];
    ensureWarehouseAllowed(scope, primaryWarehouseId);
    return primaryWarehouseId;
  }
}
