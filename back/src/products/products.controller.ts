import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  CreateProductBarcodeDto,
  ProductBarcodeResponseDto,
} from './dto/product-barcode.dto';
import {
  CreateProductDto,
  ProductResponseDto,
  SetProductStatusDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductBarcodesService } from './product-barcodes.service';
import { toProductResponse } from './products.mapper';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productBarcodesService: ProductBarcodesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Maxsulotlar ro\'yxati' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':productId/barcodes')
  @ApiOperation({ summary: 'Maxsulot barkodlari' })
  async listBarcodes(
    @Param('productId') productId: string,
  ): Promise<ProductBarcodeResponseDto[]> {
    return this.productBarcodesService.listByProductId(productId);
  }

  @Post(':productId/barcodes')
  @ApiOperation({ summary: 'Maxsulotga qo\'shimcha barkod qo\'shish' })
  async addBarcode(
    @Param('productId') productId: string,
    @Body() dto: CreateProductBarcodeDto,
  ): Promise<ProductBarcodeResponseDto> {
    return this.productBarcodesService.addManualBarcode(productId, dto.value);
  }

  @Delete(':productId/barcodes/:barcodeId')
  @ApiOperation({ summary: 'Qo\'shimcha barkodni o\'chirish' })
  async removeBarcode(
    @Param('productId') productId: string,
    @Param('barcodeId') barcodeId: string,
  ): Promise<{ success: true }> {
    await this.productBarcodesService.removeBarcode(productId, barcodeId);
    return { success: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Maxsulot ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findById(id);
    return toProductResponse(product);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi maxsulot yaratish' })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsService.create(dto);
    return toProductResponse(product);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Maxsulotni yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(id, dto);
    return toProductResponse(product);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Maxsulotni faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: SetProductStatusDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.setActive(id, body.isActive);
    return toProductResponse(product);
  }
}
