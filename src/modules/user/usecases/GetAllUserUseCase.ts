import { Inject, Injectable } from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { User } from 'src/core/domain/entities/user';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IUSER_CONTRACT } from 'src/shared/constants';

type GetAllUserInput = {
  org_id: string;
  page: number;
  owner_id: string;
};

interface IGetAllUserUseCase {
  execute(data: GetAllUserInput): Promise<{
    users: User[];
    has_next: boolean;
  }>;
}

@Injectable()
export class GetAllUserUseCase implements IGetAllUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({ org_id, page, owner_id }: GetAllUserInput): Promise<{
    users: User[];
    has_next: boolean;
  }> {
    const className = GetAllUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca de todos os usuários para organização '${org_id}', owner_id: '${owner_id}', page: '${page}'.`,
    );
    try {
      const result = await this.userContract.getAll({
        owner_id,
        org_id,
        page,
      });
      this.observabilityService.log(
        className,
        `Usuários encontrados: ${result.users.length}, has_next: ${result.has_next} para organização '${org_id}'.`,
      );
      return result;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar todos os usuários para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
