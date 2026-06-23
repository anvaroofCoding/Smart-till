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
import { PaginationDto } from '../common/dto/pagination.dto';
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
  findAll(@Query() pagination: PaginationDto) {
    return this.productBrandsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Brend ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<ProductBrandResponseDto> {
    const brand = await this.productBrandsService.findById(id);
    return toProductBrandResponse(brand);
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
}
