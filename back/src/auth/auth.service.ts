import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
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
    const user = await this.usersService.findByLogin(dto.login);

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

  private buildAuthResponse(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const birthDate = user.birthDate
      ? new Date(user.birthDate).toISOString().slice(0, 10)
      : undefined;

    return {
      tokens: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.config.get<string>('jwt.expiresIn') ?? '7d',
      },
      user: {
        id: user._id.toString(),
        email: user.email,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
        position: user.position,
        phone: user.phone ?? '',
        birthDate,
        allowedPages: user.allowedPages ?? [],
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findForAuth(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const birthDate = user.birthDate
      ? new Date(user.birthDate).toISOString().slice(0, 10)
      : undefined;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role,
        position: user.position,
        phone: user.phone ?? '',
        birthDate,
        allowedPages: user.allowedPages ?? [],
      },
    };
  }
}
