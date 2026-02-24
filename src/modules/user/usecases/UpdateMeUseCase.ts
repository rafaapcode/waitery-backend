import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IUSER_CONTRACT, IUTILS_SERVICE } from 'src/shared/constants';

interface IUpdateMeUseCase {
  execute(
    params: IUserContract.UpdateMeParams,
  ): Promise<IUserContract.UpdateMeOutput>;
}

@Injectable()
export class UpdateMeUseCase implements IUpdateMeUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    @Inject(IUTILS_SERVICE) private readonly utilsService: IUtilsContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({
    data,
    id,
  }: IUserContract.UpdateMeParams): Promise<IUserContract.UpdateMeOutput> {
    const className = UpdateMeUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando atualização do usuário '${id}'.`,
    );
    try {
      const user = await this.userContract.getMe({ id });
      if (!user) {
        this.observabilityService.warn(
          className,
          `Usuário '${id}' não encontrado ao tentar atualizar dados próprios.`,
        );
        throw new NotFoundException('User not found');
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
      if (data.new_password && !data.password) {
        this.observabilityService.warn(
          className,
          `Credenciais inválidas ao tentar atualizar senha do usuário '${id}'.`,
        );
        throw new BadRequestException('Invalid credentials');
      }
      if (data.new_password && data.password) {
        const currentPwdIsValid = await this.validateHash(
          user.password!,
          data.password,
        );
        if (!currentPwdIsValid) {
          this.observabilityService.warn(
            className,
            `Senha atual inválida ao tentar atualizar senha do usuário '${id}'.`,
          );
          throw new BadRequestException('Invalid credentials');
        }
      }
      const userUpdated = await this.userContract.updateMe({ id, data });
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

  private async validateHash(hashPwd: string, pwd: string): Promise<boolean> {
    return await this.utilsService.validateHash(hashPwd, pwd);
  }
}
