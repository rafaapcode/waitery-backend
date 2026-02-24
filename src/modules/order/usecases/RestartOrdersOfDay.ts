import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';

interface IRestartOrdersUseCase {
  execute(org_id: string): Promise<void>;
}

@Injectable()
export class RestartOrdersOfDayUseCase implements IRestartOrdersUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(org_id: string): Promise<void> {
    const className = RestartOrdersOfDayUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando reinicialização dos pedidos do dia para organização '${org_id}'.`,
    );
    try {
      const orgExists = await this.orgContract.get({ id: org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao reinicializar pedidos do dia.`,
        );
        throw new NotFoundException('Organization not found');
      }
      await this.orderContract.restartsTheOrdersOfDay(org_id);
      this.observabilityService.log(
        className,
        `Pedidos do dia reinicializados com sucesso para organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao reinicializar pedidos do dia para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
