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

interface IUpdateUserUseCase {
  execute(
    params: IUserContract.UpdateParams,
  ): Promise<IUserContract.UpdateOutput>;
}

@Injectable()
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({
    data,
    id,
  }: IUserContract.UpdateParams): Promise<IUserContract.UpdateOutput> {
    const className = UpdateUserUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando atualização do usuário '${id}'.`,
    );
    try {
      const user = await this.userContract.get({ id });
      if (!user) {
        this.observabilityService.warn(
          className,
          `Usuário '${id}' não encontrado ao tentar atualizar usuário por id.`,
        );
        throw new NotFoundException('User not found');
      }

      if (user.role === UserRole.OWNER) {
        this.observabilityService.warn(
          className,
          `Tentativa de atualização de usuário OWNER '${id}'.`,
        );
        throw new ConflictException('Cannot update owner user');
      }

      if (data.email) {
        const userByEmail = await this.userContract.getuserByEmail({
          email: data.email,
        });
        if (userByEmail) {
          this.observabilityService.warn(
            className,
            `Já existe usuário com o email '${data.email}' ao atualizar usuário '${id}'.`,
          );
          throw new ConflictException('User with email already exists');
        }
      }

      const userUpdated = await this.userContract.update({ id, data });
      this.observabilityService.log(
        className,
        `Usuário '${id}' atualizado com sucesso.`,
      );
      return userUpdated;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao atualizar usuário '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
