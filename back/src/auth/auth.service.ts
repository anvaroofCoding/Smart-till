import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByLoginIncludingInactive(dto.login);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.buildAuthResponse(user);
  }

  async validateUser(payload: JwtPayload): Promise<JwtPayload | null> {
    const user = await this.usersService.findForAuth(payload.sub);

    if (!user) {
      return null;
    }

    return {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  private async buildAuthResponse(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      tokens: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.config.get<string>('jwt.expiresIn') ?? '3650d',
      },
      user: await this.buildAuthUser(user),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findForAuth(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return { user: await this.buildAuthUser(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return { user: await this.buildAuthUser(user) };
  }

  private async buildAuthUser(user: UserDocument) {
    const profile = await this.usersService.toResponse(user);

    return {
      id: profile.id,
      email: profile.email,
      login: profile.login,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: `${profile.firstName} ${profile.lastName}`.trim(),
      role: user.role,
      position: profile.position,
      phone: profile.phone ?? '',
      birthDate: profile.birthDate,
      allowedPages: profile.allowedPages ?? [],
      allWarehouses: profile.allWarehouses,
      warehouseIds: profile.warehouseIds,
      warehouses: profile.warehouses,
    };
  }
}
