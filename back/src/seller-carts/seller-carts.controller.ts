import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrderResponseDto } from '../orders/dto/order.dto';
import { UsersService } from '../users/users.service';
import {
  AddSellerCartItemDto,
  SellerCartListResponseDto,
  SellerCartResponseDto,
  UpdateSellerCartItemDto,
} from './dto/seller-cart.dto';
import { SellerCartsService } from './seller-carts.service';

@ApiTags('Seller carts')
@ApiBearerAuth()
@Controller('seller-carts')
export class SellerCartsController {
  constructor(
    private readonly sellerCartsService: SellerCartsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Joriy sotuvchining faol kartalari' })
  async findMine(
    @CurrentUser() user: JwtPayload,
  ): Promise<SellerCartListResponseDto> {
    return this.sellerCartsService.findMine(user.sub);
  }

  @Get('by-card/:cardNumber')
  @ApiOperation({ summary: 'Karta raqami bo\'yicha faol ro\'yxat' })
  async findByCardNumber(
    @Param('cardNumber') cardNumber: string,
  ): Promise<SellerCartResponseDto> {
    return this.sellerCartsService.findActiveByCardNumber(cardNumber);
  }

  @Put('by-card/:cardNumber')
  @ApiOperation({ summary: 'Karta raqamini band qilish (sotuvchi)' })
  async reserveCard(
    @Param('cardNumber') cardNumber: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SellerCartResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.sellerCartsService.reserveCard(cardNumber, user.sub, scope);
  }

  @Post('by-card/:cardNumber/items')
  @ApiOperation({ summary: 'Kartaga maxsulot qo\'shish' })
  async addItem(
    @Param('cardNumber') cardNumber: string,
    @Body() dto: AddSellerCartItemDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SellerCartResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.sellerCartsService.addItem(
      cardNumber,
      dto,
      user.sub,
      scope,
    );
  }

  @Patch('by-card/:cardNumber/items/:productId')
  @ApiOperation({ summary: 'Kartadagi maxsulot miqdorini yangilash' })
  async updateItem(
    @Param('cardNumber') cardNumber: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateSellerCartItemDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SellerCartResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.sellerCartsService.updateItemQuantity(
      cardNumber,
      productId,
      dto,
      user.sub,
      scope,
    );
  }

  @Delete('by-card/:cardNumber/items/:productId')
  @ApiOperation({ summary: 'Kartadan maxsulotni olib tashlash' })
  async removeItem(
    @Param('cardNumber') cardNumber: string,
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SellerCartResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.sellerCartsService.removeItem(
      cardNumber,
      productId,
      user.sub,
      scope,
    );
  }

  @Post('by-card/:cardNumber/claim')
  @ApiOperation({ summary: 'Karta ro\'yxatidan qoralama buyurtma yaratish (kassir)' })
  async claim(
    @Param('cardNumber') cardNumber: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    const scope = await this.usersService.getWarehouseScope(user.sub);
    return this.sellerCartsService.claim(cardNumber, user.sub, scope);
  }
}
