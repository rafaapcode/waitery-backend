import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IGetByIdCategoryUseCase {
  execute(id: string, org_id: string): Promise<Category>;
}

@Injectable()
export class GetByIdCategoryUseCase implements IGetByIdCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
    private readonly observabilityService: ObservabilityService,
  ) {}
  async execute(id: string, org_id: string): Promise<Category> {
    const className = GetByIdCategoryUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca da categoria '${id}' para organização '${org_id}'.`,
    );
    try {
      const cat = await this.catContract.getCategory({ id, orgId: org_id });
      if (!cat) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' não encontrada para organização '${org_id}'.`,
        );
        throw new NotFoundException('Category not found');
      }
      if (cat.org_id !== org_id) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' não pertence à organização '${org_id}'.`,
        );
        throw new ConflictException(
          'Category does not belong to this organization',
        );
      }
      this.observabilityService.log(
        className,
        `Categoria '${id}' encontrada para organização '${org_id}'.`,
      );
      return cat;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar categoria '${id}' para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
