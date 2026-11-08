import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_menu_jwt_secret_key_restaurant_2026',
  CUSTOMER_JWT_SECRET: process.env.CUSTOMER_JWT_SECRET || 'smart_menu_customer_session_secret_2026',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
