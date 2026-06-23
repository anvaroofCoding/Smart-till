import { UserDocument } from './schemas/user.schema';
import { UserResponseDto } from './dto/user.dto';

export function toUserResponse(user: UserDocument): UserResponseDto {
  const birthDate = user.birthDate
    ? new Date(user.birthDate).toISOString().slice(0, 10)
    : undefined;

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    login: user.login,
    email: user.email,
    phone: user.phone ?? '',
    age: user.age ?? 0,
    birthDate,
    position: user.position,
    allowedPages: user.allowedPages ?? [],
    avatar: user.avatar ?? '',
    isActive: user.isActive,
    createdAt: (user as UserDocument & { createdAt: Date }).createdAt,
    updatedAt: (user as UserDocument & { updatedAt: Date }).updatedAt,
  };
}
