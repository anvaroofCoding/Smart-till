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
import { UserRole } from '../common/constants/roles';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UsersStatsDto,
} from './dto/user.dto';
import { UsersService } from './users.service';
import { toUserResponse } from './users.mapper';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Foydalanuvchilar statistikasi' })
  getStats(): Promise<UsersStatsDto> {
    return this.usersService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Foydalanuvchilar ro\'yxati' })
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Foydalanuvchi ma\'lumotlari' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdAdmin(id);
    return toUserResponse(user);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi foydalanuvchi yaratish' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.createFromDto(dto);
    return toUserResponse(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Foydalanuvchini yangilash' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto);
    return toUserResponse(user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Foydalanuvchini faol yoki nofaol qilish' })
  async setStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.setActive(id, body.isActive);
    return toUserResponse(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Foydalanuvchini nofaol qilish (eski API)' })
  async remove(@Param('id') id: string) {
    await this.usersService.deactivate(id);
    return { message: 'User deactivated' };
  }
}
