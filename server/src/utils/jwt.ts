import jwt, { SignOptions } from 'jsonwebtoken';
import { StaffRole } from '@prisma/client';
import { ENV } from '../config/env';

export interface StaffJwtPayload {
  staffId: string;
  restaurantId: string;
  email: string;
  name: string;
  role: StaffRole;
}

export interface CustomerJwtPayload {
  tableId: string;
  restaurantId: string;
  tableNumber: number;
  sessionToken: string;
}

export function signStaffToken(
  payload: StaffJwtPayload,
  expiresIn: SignOptions['expiresIn'] = '7d'
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, ENV.JWT_SECRET, options);
}

export function verifyStaffToken(token: string): StaffJwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as StaffJwtPayload;
}

export function signCustomerToken(
  payload: CustomerJwtPayload,
  expiresIn: SignOptions['expiresIn'] = '12h'
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, ENV.CUSTOMER_JWT_SECRET, options);
}

export function verifyCustomerToken(token: string): CustomerJwtPayload {
  return jwt.verify(token, ENV.CUSTOMER_JWT_SECRET) as CustomerJwtPayload;
}
