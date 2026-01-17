import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class FactoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateUserInfo(role: UserRole, persistent?: boolean) {
    const userName = faker.person.fullName();
    const userId = faker.string.uuid();
    const userEmail = faker.internet.email();
    const userCpf = faker.string.numeric(11);
    const hashBcrypt = faker.string.alphanumeric(60);

    if (persistent) {
      const user = await this.prismaService.user.create({
        data: {
          name: userName,
          email: userEmail,
          cpf: userCpf,
          password: hashBcrypt,
          role,
        },
      });

      return user;
    }

    return {
      name: userName,
      id: userId,
      email: userEmail,
      cpf: userCpf,
      password: hashBcrypt,
      role,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}
