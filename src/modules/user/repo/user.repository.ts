import { Injectable } from '@nestjs/common';
import { Organization, User } from 'generated/prisma';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class UserRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IUserContract.CreateParams['data']): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        cpf: data.cpf,
        email: data.email,
        password: data.password ?? '',
        name: data.name,
        role: data.role,
      },
    });
    return user;
  }

  async update({ data, id }: IUserContract.UpdateParams): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.role && { role: data.role }),
        ...(data.password && { password: data.password }),
      },
    });

    return user;
  }

  async updateMe({ data, id }: IUserContract.UpdateMeParams): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.new_password && { password: data.new_password }),
      },
    });

    return user;
  }

  async delete({ id }: IUserContract.DeleteParams): Promise<boolean> {
    await this.prisma.user.delete({ where: { id } });
    return true;
  }

  async getAll(org_id: string, offset: number, limit: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        created_at: 'desc',
      },
      where: {
        orgs: {
          every: {
            org_id,
          },
        },
      },
    });

    return users;
  }

  async getMe({ id }: IUserContract.GetMeParams): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user;
  }

  async get({ id }: IUserContract.GetParams): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: id } });
    return user;
  }

  async getuserByEmail({
    email,
  }: IUserContract.GetUserByEmailParams): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  async getuserByCpf({
    cpf,
  }: IUserContract.GetUserByCpfParams): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { cpf } });
    return user;
  }

  async getUserOrgs({
    owner_id,
  }: IUserContract.GetOrgsParams): Promise<Organization[]> {
    const org = await this.prisma.organization.findMany({
      where: { owner_id },
    });

    return org;
  }

  async createRelationWithOrg(org_id: string, user_id: string): Promise<void> {
    await this.prisma.userOrg.create({
      data: {
        org_id,
        user_id,
      },
    });
  }

  async verifyOrgById(org_id: string, owner_id: string): Promise<boolean> {
    const org = await this.prisma.organization.findFirst({
      where: {
        AND: [
          {
            owner_id,
          },
          {
            id: org_id,
          },
        ],
      },
    });
    return org !== null;
  }
}
