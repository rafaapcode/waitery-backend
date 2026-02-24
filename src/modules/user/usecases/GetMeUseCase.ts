import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User } from 'src/core/domain/entities/user';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IGetMeUseCase {
  execute(id: string): Promise<User>;
}

@Injectable()
export class GetMeUseCase implements IGetMeUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string): Promise<User> {
    const className = GetMeUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca do usuário '${id}'.`,
    );
    try {
      const user = await this.userContract.getMe({ id });
      if (!user) {
        this.observabilityService.warn(
          className,
          `Usuário '${id}' não encontrado ao buscar informações próprias.`,
        );
        throw new NotFoundException('User not found');
      }
      this.observabilityService.log(
        className,
        `Usuário '${id}' encontrado ao buscar informações próprias.`,
      );
      return user;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar informações do usuário '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
