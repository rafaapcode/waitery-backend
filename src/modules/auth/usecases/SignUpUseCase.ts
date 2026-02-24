import { Inject, Injectable } from '@nestjs/common';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IAUTH_CONTRACT } from 'src/shared/constants';

interface ISignUpUseCase {
  execute(
    data: IAuthContract.SignUpParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignUpOutput>;
}

@Injectable()
export class SignUpUseCase implements ISignUpUseCase {
  constructor(
    @Inject(IAUTH_CONTRACT) private readonly authService: IAuthContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    data: IAuthContract.SignUpParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignUpOutput> {
    const className = SignUpUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando signUp para o usuário: ${data.email}`,
    );
    try {
      const user = await this.authService.signUp(data, user_agent, ip_address);
      this.observabilityService.log(
        className,
        `SignUp realizado com sucesso para o usuário: ${data.email}`,
      );
      return user;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao realizar signUp para o usuário: ${data.email}`,
        '',
      );
      throw error;
    }
  }
}
