import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { UpdateCategoryDto } from '../dto/update-category.dto';

interface IUpdateCategoryUseCase {
  execute(
    id: string,
    org_id: string,
    data: UpdateCategoryDto,
  ): Promise<Category>;
}

@Injectable()
export class UpdateCategoryUseCase implements IUpdateCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
    private readonly observabilityService: ObservabilityService,
  ) {}
  async execute(
    id: string,
    org_id: string,
    data: UpdateCategoryDto,
  ): Promise<Category> {
    const className = UpdateCategoryUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando atualização da categoria '${id}' para organização '${org_id}'.`,
    );
    try {
      const cat_exists = await this.catContract.getCategory({
        id,
        orgId: org_id,
      });
      if (!cat_exists) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' não encontrada para atualização na organização '${org_id}'.`,
        );
        throw new NotFoundException('Category not found');
      }
      const belongsToOrg = cat_exists.org_id === org_id;
      if (!belongsToOrg) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' não pertence à organização '${org_id}'.`,
        );
        throw new BadRequestException(
          'Category does not belong to this organization',
        );
      }
      this.observabilityService.log(
        className,
        `Persistindo atualização da categoria '${id}' para organização '${org_id}'.`,
      );
      const updated_cat = await this.catContract.update({
        id,
        category: data,
      });
      this.observabilityService.log(
        className,
        `Categoria '${id}' atualizada com sucesso para organização '${org_id}'.`,
      );
      return updated_cat;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao atualizar categoria '${id}' para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
