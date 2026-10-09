import { registerAs } from '@nestjs/config';

export const DATABASE_CONFIG = 'database';

export default registerAs(DATABASE_CONFIG, () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'deruta',
  password: process.env.DB_PASSWORD || 'deruta',
  database: process.env.DB_NAME || 'deruta',
}));
