import { UserRole } from 'src/domain/entities/user';
import { Request } from 'src/express';

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      role?: UserRole;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  role: UserRole;
}
