import {
  Body,
  Controller,
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
  CreateProductDto,
  ProductResponseDto,
  SetProductStatusDto,
  UpdateProductDto,
} from './dto/product.dto';
import { toProductResponse } from './products.mapper';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Maxsulotlar ro\'yxati' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
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
