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
  CreateProductCategoryDto,
  ProductCategoryResponseDto,
  SetProductCategoryStatusDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';
import { toProductCategoryResponse } from './product-categories.mapper';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('Product Categories')
@ApiBearerAuth()
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Maxsulot kategoriyalari ro\'yxati' })
  findAll(@Query() pagination: PaginationDto) {
    return this.productCategoriesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kategoriya ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<ProductCategoryResponseDto> {
    const category = await this.productCategoriesService.findById(id);
    return toProductCategoryResponse(category);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi kategoriya yaratish' })
  async create(
    @Body() dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.productCategoriesService.create(dto);
    return toProductCategoryResponse(category);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kategoriyani yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.productCategoriesService.update(id, dto);
    return toProductCategoryResponse(category);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Kategoriyani faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: SetProductCategoryStatusDto,
  ): Promise<ProductCategoryResponseDto> {
    const category = await this.productCategoriesService.setActive(
      id,
      body.isActive,
    );
    return toProductCategoryResponse(category);
  }
}
