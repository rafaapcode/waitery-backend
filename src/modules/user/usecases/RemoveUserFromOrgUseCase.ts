import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IUserContract } from 'src/core/application/contracts/user/IUserContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORGANIZATION_CONTRACT, IUSER_CONTRACT } from 'src/shared/constants';

interface IRemoveUserFromOrgUseCase {
  execute(
    org_ids: IUserContract.RemoveUserFromOrgParams,
  ): Promise<IUserContract.RemoveUserFromOrgOutput>;
}

@Injectable()
export class RemoveUserFromOrgUseCase implements IRemoveUserFromOrgUseCase {
  constructor(
    @Inject(IUSER_CONTRACT) private readonly userContract: IUserContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly organizationContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({
    org_ids,
    user_id,
  }: IUserContract.RemoveUserFromOrgParams): Promise<IUserContract.RemoveUserFromOrgOutput> {
    const className = RemoveUserFromOrgUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando remoção do usuário '${user_id}' das organizações: ${JSON.stringify(org_ids)}.`,
    );
    try {
      const user = await this.userContract.get({ id: user_id });
      if (!user) {
        this.observabilityService.warn(
          className,
          `Usuário '${user_id}' não encontrado ao tentar remover de organizações.`,
        );
        throw new NotFoundException('User not found');
      }
      const orgs = await this.organizationContract.getAllByOrgId({ org_ids });
      if (!orgs || orgs.length === 0) {
        this.observabilityService.warn(
          className,
          `Organizações não encontradas ao tentar remover usuário '${user_id}'.`,
        );
        throw new NotFoundException('Organization not found');
      }
      await this.userContract.removeUserFromOrg({
        user_id,
        org_ids: orgs.map((org) => org.id),
      });
      this.observabilityService.log(
        className,
        `Usuário '${user_id}' removido com sucesso das organizações: ${JSON.stringify(orgs.map((org) => org.id))}.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao remover usuário '${user_id}' das organizações: ${JSON.stringify(org_ids)}.`,
        '',
      );
      throw error;
    }
  }
}
