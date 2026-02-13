import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UserRole } from 'src/core/domain/entities/user';
import { JwtPayload } from 'src/express';
import { IS_PUBLIC_KEY } from '../decorators/IsPublic';
import { ROLES_KEY } from '../decorators/Role';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException('Invalid Token');

    const requiredRole = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        algorithms: ['HS256'],
      });

      if (requiredRole && !requiredRole.includes(payload.role as UserRole)) {
        throw new UnauthorizedException('Unauthorized to do this.');
      }

      if (
        !this.verifyTheOriginOfRequest(
          req.headers['user-agent'] || 'unknown',
          req.ip || '',
          payload,
        )
      ) {
        throw new UnauthorizedException('Invalid Token');
      }

      request.user = {
        cpf: payload.cpf,
        email: payload.email,
        id: payload.id,
        name: payload.name,
        role: UserRole[payload.role as keyof UserRole],
        user_agent: payload.user_agent,
        ip_address: payload.ip_address,
      };
      request.role = payload.role;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Token');
    }
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return undefined;
    }
    return token;
  }

  private verifyTheOriginOfRequest(
    userAgent: string,
    ipAddress: string,
    jwtPayload: JwtPayload,
  ): boolean {
    return (
      userAgent === jwtPayload.user_agent && ipAddress === jwtPayload.ip_address
    );
  }
}
