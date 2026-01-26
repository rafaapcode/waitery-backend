import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export const GetOrgId = createParamDecorator(
  (_data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const orgId = req.headers['x-org-id'] as string | undefined;
    if (!orgId) throw new BadRequestException('OrgID is not valid');

    return orgId;
  },
);
