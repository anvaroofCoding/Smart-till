import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  NotificationResponseDto,
  NotificationUnreadCountDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirishnomalar ro\'yxati' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
  ) {
    return this.notificationsService.findForUser(
      user.sub,
      query.page,
      query.perPage,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'O\'qilmagan bildirishnomalar soni' })
  getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationUnreadCountDto> {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Barcha bildirishnomalarni o\'qilgan deb belgilash' })
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Bildirishnomani o\'qilgan deb belgilash' })
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto | null> {
    return this.notificationsService.markAsRead(user.sub, id);
  }
}
