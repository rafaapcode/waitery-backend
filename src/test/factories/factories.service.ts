import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class FactoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async generateUserInfo(role: UserRole = UserRole.OWNER) {
    const userName = faker.person.fullName();
    const userEmail = faker.internet.email();
    const userCpf = faker.string.numeric(11);
    const hashBcrypt =
      '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u'; // qweasdzxc2003

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
}
