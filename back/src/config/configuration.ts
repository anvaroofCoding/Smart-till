export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'Warehouse API',
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
    bodyLimit: process.env.BODY_LIMIT ?? '5mb',
  },
  database: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/warehouse',
  },
  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false',
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '3650d',
  },
  session: {
    secret: process.env.SESSION_SECRET ?? 'change-me-session-secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE ?? '86400000', 10),
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH ?? 'docs',
  },
  seed: {
    adminOnStartup: process.env.SEED_ADMIN_ON_STARTUP !== 'false',
    adminLogin: process.env.SEED_ADMIN_LOGIN ?? 'admin',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? '123123',
    adminFirstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin',
    adminLastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Administrator',
    adminLegacyEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@warehouse.uz',
  },
});
