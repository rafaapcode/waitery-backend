import { Inject, Injectable } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { Organization } from 'src/core/domain/entities/organization';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IGetOrgsOfUserUseCase {
  execute(id: string): Promise<Organization[]>;
}

@Injectable()
export class GetOrgsOfUserUseCase implements IGetOrgsOfUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string): Promise<Organization[]> {
    const className = GetOrgsOfUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca das organizações do usuário '${id}'.`,
    );
    try {
      const org = await this.userContract.getOrgs({ owner_id: id });
      this.observabilityService.log(
        className,
        `Organizações encontradas: ${org.length} para usuário '${id}'.`,
      );
      return org;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar organizações do usuário '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
