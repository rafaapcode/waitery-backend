import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { UserRole } from 'src/core/domain/entities/user';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IUSER_CONTRACT } from 'src/shared/constants';

interface IDeleteUserUseCase {
  execute(id: string): Promise<void>;
}

@Injectable()
export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string): Promise<void> {
    const className = DeleteUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando exclusão do usuário '${id}'.`,
    );
    try {
      const user = await this.userContract.get({ id });
      if (!user) {
        this.observabilityService.warn(
          className,
          `Usuário '${id}' não encontrado para exclusão.`,
        );
        throw new NotFoundException('User not found');
      }
      if (user.role === UserRole.OWNER) {
        this.observabilityService.warn(
          className,
          `Tentativa de exclusão de usuário OWNER '${id}'.`,
        );
        throw new ConflictException('Cannot delete owner user');
      }
      await this.userContract.delete({ id });
      this.observabilityService.log(
        className,
        `Usuário '${id}' excluído com sucesso.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao excluir usuário '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
