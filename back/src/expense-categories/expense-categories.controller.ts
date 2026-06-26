import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateExpenseCategoryDto } from '../daily-balances/dto/daily-balance.dto';
import { ExpenseCategoriesService } from './expense-categories.service';

@ApiTags('Expense Categories')
@ApiBearerAuth()
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Xarajat turlari ro\'yxati' })
  async findAll(@Query('all') all?: string) {
    return this.expenseCategoriesService.findAll(all !== 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Xarajat turi qo\'shish' })
  async create(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xarajat turini o\'chirish (deaktivatsiya)' })
  async deactivate(@Param('id') id: string) {
    return this.expenseCategoriesService.deactivate(id);
  }
}
