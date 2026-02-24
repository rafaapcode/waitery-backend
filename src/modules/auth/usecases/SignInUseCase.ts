import { Inject, Injectable } from '@nestjs/common';
import { IAuthContract } from 'src/core/application/contracts/auth/IAuthContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IAUTH_CONTRACT } from 'src/shared/constants';

interface ISignInUseCase {
  execute(
    data: IAuthContract.SignInParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignInOutput>;
}

@Injectable()
export class SignInUseCase implements ISignInUseCase {
  constructor(
    @Inject(IAUTH_CONTRACT) private readonly authService: IAuthContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(
    data: IAuthContract.SignInParams,
    user_agent: string,
    ip_address: string,
  ): Promise<IAuthContract.SignInOutput> {
    const className = SignInUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando signIn para o usuário: ${data.email}`,
    );
    try {
      const user = await this.authService.signIn(data, user_agent, ip_address);
      this.observabilityService.log(
        className,
        `SignIn realizado com sucesso para o usuário: ${data.email}`,
      );
      return user;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao realizar signIn para o usuário: ${data.email}`,
        '',
      );
      throw error;
    }
  }
}
