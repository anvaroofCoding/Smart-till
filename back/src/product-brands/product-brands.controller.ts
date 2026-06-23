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
import { ProductBrandQueryDto } from './dto/product-brand-query.dto';
import {
  CreateProductBrandDto,
  ProductBrandResponseDto,
  SetProductBrandStatusDto,
  UpdateProductBrandDto,
} from './dto/product-brand.dto';
import { toProductBrandResponse } from './product-brands.mapper';
import { ProductBrandsService } from './product-brands.service';

@ApiTags('Product Brands')
@ApiBearerAuth()
@Controller('product-brands')
export class ProductBrandsController {
  constructor(private readonly productBrandsService: ProductBrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Maxsulot brendlari ro\'yxati' })
  findAll(@Query() query: ProductBrandQueryDto) {
    return this.productBrandsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Brend ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<ProductBrandResponseDto> {
    return this.productBrandsService.findByIdWithUsage(id);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi brend yaratish' })
  async create(
    @Body() dto: CreateProductBrandDto,
  ): Promise<ProductBrandResponseDto> {
    const brand = await this.productBrandsService.create(dto);
    return toProductBrandResponse(brand);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Brendni yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductBrandDto,
  ): Promise<ProductBrandResponseDto> {
    const brand = await this.productBrandsService.update(id, dto);
    return toProductBrandResponse(brand);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Brendni faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: SetProductBrandStatusDto,
  ): Promise<ProductBrandResponseDto> {
    const brand = await this.productBrandsService.setActive(id, body.isActive);
    return toProductBrandResponse(brand);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brendni o\'chirish' })
  async remove(@Param('id') id: string) {
    await this.productBrandsService.remove(id);
    return { message: 'Brend o\'chirildi' };
  }
}
