import { StaffJwtPayload, CustomerJwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      staff?: StaffJwtPayload;
      customerSession?: CustomerJwtPayload;
    }
  }
}
