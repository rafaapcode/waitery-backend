import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Category } from 'src/core/domain/entities/category';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
} from 'src/shared/constants';

interface IGetAllCategoryUseCase {
  execute(org_id: string): Promise<Category[]>;
}

@Injectable()
export class GetAllCategoryUseCase implements IGetAllCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}
  async execute(org_id: string): Promise<Category[]> {
    const className = GetAllCategoryUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca de todas as categorias para organização '${org_id}'.`,
    );
    try {
      const orgExists = await this.orgContract.get({
        id: org_id,
      });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao buscar categorias.`,
        );
        throw new NotFoundException('Organization not found');
      }

      const allCats = await this.catContract.getAllCategories(org_id);
      this.observabilityService.log(
        className,
        `Busca de categorias realizada com sucesso para organização '${org_id}'. Total encontrado: ${allCats.length}`,
      );
      return allCats;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar categorias para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
