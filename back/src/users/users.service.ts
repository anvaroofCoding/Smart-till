import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/constants/roles';
import { UserPosition } from '../common/constants/positions';
import { TOTAL_APP_PAGES } from '../common/constants/app-routes';
import {
  resolveUserWarehouseScope,
  type UserWarehouseScope,
} from '../common/utils/user-warehouse-scope';
import { PaginationDto, DEFAULT_PER_PAGE } from '../common/dto/pagination.dto';
import { RegisterDto } from '../auth/dto/auth.dto';
import { UpdateProfileDto } from '../auth/dto/profile.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { toUserResponse, toUserResponses } from './users.mapper';
import {
  Warehouse,
  WarehouseDocument,
} from '../warehouses/schemas/warehouse.schema';

function positionToRole(position: UserPosition): UserRole {
  if (position === UserPosition.ADMIN || position === UserPosition.MENEJER) {
    return UserRole.ADMIN;
  }
  if (position === UserPosition.SOTUVCHI) {
    return UserRole.DRIVER;
  }
  return UserRole.SCANNER;
}

function buildInternalEmail(login: string, email?: string): string {
  if (email) return email.toLowerCase().trim();
  const normalized = login.toLowerCase().trim();
  return normalized.includes('@') ? normalized : `${normalized}@zaxirax.local`;
}

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
  ) {}

  async create(dto: RegisterDto): Promise<UserDocument> {
    const parts = dto.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? dto.fullName;
    const lastName = parts.slice(1).join(' ') || firstName;

    return this.createFromDto({
      firstName,
      lastName,
      login: dto.login,
      password: dto.password,
      position:
        dto.role === UserRole.ADMIN ? UserPosition.ADMIN : UserPosition.KASSIR,
    });
  }

  async createFromDto(dto: CreateUserDto): Promise<UserDocument> {
    const login = dto.login.toLowerCase().trim();
    const email = buildInternalEmail(login, dto.email);

    const existing = await this.userModel.findOne({
      $or: [{ login }, { email }],
    });

    if (existing) {
      throw new ConflictException('Login or email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const warehouseAssignment = await this.resolveWarehouseAssignment(
      dto.position,
      dto.allWarehouses,
      dto.warehouseIds,
    );

    const user = await this.userModel.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      login,
      email,
      passwordHash,
      phone: dto.phone?.trim() ?? '',
      age: dto.age ?? 0,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      position: dto.position,
      role: positionToRole(dto.position),
      allowedPages: dto.allowedPages ?? [],
      allWarehouses: warehouseAssignment.allWarehouses,
      warehouseIds: warehouseAssignment.warehouseIds,
      avatar: dto.avatar ?? '',
    });

    return user;
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? DEFAULT_PER_PAGE;
    const skip = (page - 1) * perPage;

    const filter: {
      $or?: Array<Record<string, RegExp>>;
    } = {};

    if (pagination.search?.trim()) {
      const search = pagination.search.trim();
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { login: regex },
        { phone: regex },
        { email: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: await toUserResponses(items, this.warehouseModel),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async getStats() {
    const users = await this.userModel
      .find()
      .select('position role allowedPages isActive')
      .lean()
      .exec();

    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const inactive = total - active;

    let accessSum = 0;
    for (const user of users) {
      if (
        user.position === UserPosition.ADMIN ||
        user.role === UserRole.ADMIN
      ) {
        accessSum += 100;
      } else {
        const pages = user.allowedPages?.length ?? 0;
        accessSum += Math.min(
          100,
          Math.round((pages / TOTAL_APP_PAGES) * 100),
        );
      }
    }

    const profileAccessLevel = total > 0 ? Math.round(accessSum / total) : 0;

    return { total, active, inactive, profileAccessLevel };
  }

  private async findByIdOrThrow(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findForAuth(id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.findByIdOrThrow(id);

    if (!user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdAdmin(id: string): Promise<UserDocument> {
    return this.findByIdOrThrow(id);
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    const normalized = login.toLowerCase().trim();
    return this.userModel
      .findOne({
        $or: [{ login: normalized }, { email: normalized }],
        isActive: true,
      })
      .select('+passwordHash')
      .exec();
  }

  async findByLoginIncludingInactive(
    login: string,
  ): Promise<UserDocument | null> {
    const normalized = login.toLowerCase().trim();
    return this.userModel
      .findOne({
        $or: [{ login: normalized }, { email: normalized }],
      })
      .select('+passwordHash')
      .exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findByLogin(email);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findByIdAdmin(id);

    if (dto.login) {
      const login = dto.login.toLowerCase().trim();
      const duplicate = await this.userModel.findOne({
        login,
        _id: { $ne: user._id },
      });
      if (duplicate) {
        throw new ConflictException('Login already in use');
      }
      user.login = login;
      if (!dto.email) {
        user.email = buildInternalEmail(login);
      }
    }

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const duplicate = await this.userModel.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (duplicate) {
        throw new ConflictException('Email already in use');
      }
      user.email = email;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.age !== undefined) user.age = dto.age;
    if (dto.birthDate !== undefined) {
      user.birthDate = dto.birthDate ? new Date(dto.birthDate) : undefined;
    }
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.allowedPages !== undefined) user.allowedPages = dto.allowedPages;
    if (dto.position !== undefined) {
      user.position = dto.position;
      user.role = positionToRole(dto.position);
    }

    if (
      dto.allWarehouses !== undefined ||
      dto.warehouseIds !== undefined ||
      dto.position !== undefined
    ) {
      const assignment = await this.resolveWarehouseAssignment(
        user.position,
        dto.allWarehouses ?? user.allWarehouses,
        dto.warehouseIds ?? user.warehouseIds.map((id) => id.toString()),
      );
      user.allWarehouses = assignment.allWarehouses;
      user.warehouseIds = assignment.warehouseIds;
    }

    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    await user.save();
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.findForAuth(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.login) {
      const login = dto.login.toLowerCase().trim();
      const duplicate = await this.userModel.findOne({
        login,
        _id: { $ne: user._id },
      });
      if (duplicate) {
        throw new ConflictException('Login already in use');
      }
      user.login = login;
      user.email = buildInternalEmail(login);
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.birthDate !== undefined) {
      user.birthDate = dto.birthDate ? new Date(dto.birthDate) : undefined;
    }
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    await user.save();
    return user;
  }

  async setActive(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.findByIdAdmin(id);
    user.isActive = isActive;
    await user.save();
    return user;
  }

  async deactivate(id: string): Promise<void> {
    await this.setActive(id, false);
  }

  async ensureSeedAdmin(
    options: {
      login: string;
      password: string;
      firstName: string;
      lastName: string;
      legacyEmail: string;
    },
    mode: 'force' | 'bootstrap' = 'force',
  ): Promise<'created' | 'updated' | 'migrated' | 'skipped'> {
    const login = options.login.toLowerCase().trim();
    const existing = await this.findByLoginIncludingInactive(login);

    if (existing) {
      if (mode === 'bootstrap' && existing.isActive) {
        return 'skipped';
      }

      await this.update(existing._id.toString(), {
        ...(mode === 'force' ? { password: options.password } : {}),
        firstName: options.firstName,
        lastName: options.lastName,
        position: UserPosition.ADMIN,
        allWarehouses: true,
        isActive: true,
      });
      return 'updated';
    }

    const legacy = await this.findByLoginIncludingInactive(options.legacyEmail);

    if (legacy) {
      await this.update(legacy._id.toString(), {
        login,
        password: options.password,
        firstName: options.firstName,
        lastName: options.lastName,
        position: UserPosition.ADMIN,
        allWarehouses: true,
        isActive: true,
      });
      return 'migrated';
    }

    await this.createFromDto({
      firstName: options.firstName,
      lastName: options.lastName,
      login,
      password: options.password,
      phone: '+998 90 000 00 01',
      age: 30,
      position: UserPosition.ADMIN,
      allWarehouses: true,
    });

    return 'created';
  }

  async getWarehouseScope(userId: string): Promise<UserWarehouseScope> {
    const user = await this.findByIdOrThrow(userId);
    return resolveUserWarehouseScope(user);
  }

  async toResponse(user: UserDocument) {
    return toUserResponse(user, this.warehouseModel);
  }

  private async resolveWarehouseAssignment(
    position: UserPosition,
    allWarehouses?: boolean,
    warehouseIds?: string[],
  ): Promise<{ allWarehouses: boolean; warehouseIds: Types.ObjectId[] }> {
    const grantsAll =
      position === UserPosition.ADMIN || Boolean(allWarehouses);

    if (grantsAll) {
      return { allWarehouses: true, warehouseIds: [] };
    }

    const ids = [...new Set((warehouseIds ?? []).filter(Boolean))];
    if (ids.length === 0) {
      throw new BadRequestException('Kamida bitta omborni tanlang yoki barcha omborlarga ruxsat bering');
    }

    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const found = await this.warehouseModel
      .find({ _id: { $in: objectIds } })
      .select('_id')
      .exec();

    if (found.length !== ids.length) {
      throw new BadRequestException('Tanlangan omborlardan biri topilmadi');
    }

    return { allWarehouses: false, warehouseIds: objectIds };
  }
}
