import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User } from 'src/core/domain/entities/user';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IGetUserUseCase {
  execute(id: string): Promise<User>;
}

@Injectable()
export class GetUserUseCase implements IGetUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string): Promise<User> {
    const className = GetUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca do usuário '${id}'.`,
    );
    try {
      const user = await this.userContract.get({ id });
      if (!user) {
        this.observabilityService.warn(
          className,
          `Usuário '${id}' não encontrado ao buscar usuário por id.`,
        );
        throw new NotFoundException('User not found');
      }
      this.observabilityService.log(
        className,
        `Usuário '${id}' encontrado ao buscar usuário por id.`,
      );
      return user;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar usuário '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
