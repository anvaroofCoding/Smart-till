# Warehouse Backend

Professional NestJS backend for the warehouse management system.

## Stack

| Texnologiya | Vazifasi |
|---|---|
| **NestJS** | Asosiy backend framework (TypeScript) |
| **MongoDB + Mongoose** | Asosiy ma'lumotlar bazasi |
| **Redis** | Kesh va sessiya saqlash |
| **BullMQ** | Fondagi og'ir vazifalar (import/export navbatlari) |
| **Socket.io** | Real-vaqt ma'lumot almashish |
| **Passport + JWT** | Autentifikatsiya va rollar (Admin, Skanerchi, Haydovchi) |
| **Swagger** | API hujjatlari (`/docs`) |
| **class-validator** | Request validatsiyasi |

## Tez boshlash

### 1. Infratuzilma (MongoDB + Redis)

```bash
npm run docker:up
```

> Redis bo'lmasa ham development rejimida server ishga tushadi (in-memory fallback).
> Redis yo'q bo'lsa avtomatik `REDIS_ENABLED=false` qilinadi.
> Qo'lda o'chirish uchun `.env` da: `REDIS_ENABLED=false`

### 2. Muhit o'zgaruvchilari

```bash
cp .env.example .env
```

### 3. Admin foydalanuvchi yaratish

```bash
npm run seed:admin
```

### 4. Development server

```bash
npm run start:dev
```

- **API:** http://localhost:3000/api
- **Swagger:** http://localhost:3000/docs
- **WebSocket:** http://localhost:3000
- **Health:** http://localhost:3000/api/health

## Loyiha tuzilmasi

```
src/
├── auth/           # JWT + Passport autentifikatsiya
├── cache/          # Redis kesh moduli
├── common/         # Guard, filter, interceptor, decorator
├── config/         # Muhit sozlamalari va validatsiya
├── database/       # MongoDB ulanishi va seed skriptlar
├── health/         # Tizim holati endpoint
├── queue/          # BullMQ navbatlar (import/export)
├── redis/          # Redis client moduli
├── users/          # Foydalanuvchilar (Mongoose schema)
└── websocket/      # Socket.io gateway (frontend bilan mos)
```

## Foydali buyruqlar

```bash
npm run start:dev      # Hot-reload development
npm run build          # Production build
npm run start:prod     # Production ishga tushirish
npm run lint           # ESLint
npm run test           # Unit testlar
npm run test:e2e       # E2E testlar
npm run seed:admin     # Birinchi admin yaratish
```

## Frontend integratsiya

Frontend (`front/`) quyidagi manzillarni kutadi:

- `VITE_API_BASE_URL=http://localhost:3000/api`
- `VITE_SOCKET_URL=http://localhost:3000`

Socket event nomlari frontend `socket/types.ts` bilan moslashtirilgan.

## Rollar

| Rol | Qiymat | Tavsif |
|---|---|---|
| Admin | `admin` | To'liq boshqaruv huquqi |
| Skanerchi | `scanner` | Barkod skanerlash |
| Haydovchi | `driver` | Yetkazib berish operatsiyalari |
