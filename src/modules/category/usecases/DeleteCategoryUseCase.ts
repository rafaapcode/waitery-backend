import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';

interface IDeleteCategoryUseCase {
  execute(id: string, org_id: string): Promise<void>;
}

@Injectable()
export class DeleteCategoryUseCase implements IDeleteCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
    private readonly observabilityService: ObservabilityService,
  ) {}
  async execute(id: string, org_id: string): Promise<void> {
    const className = DeleteCategoryUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando exclusão da categoria '${id}' para organização '${org_id}'.`,
    );
    try {
      const catExists = await this.catContract.getCategory({ id });
      if (!catExists) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' não encontrada para exclusão na organização '${org_id}'.`,
        );
        throw new NotFoundException('Category not found');
      }

      const belongsToOrg = catExists.org_id === org_id;
      if (!belongsToOrg) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' não pertence à organização '${org_id}'.`,
        );
        throw new BadRequestException(
          'Category does not belong to this organization',
        );
      }

      const hasProducts = await this.catContract.isBeingUsed({
        cat_id: id,
        org_id,
      });
      if (hasProducts) {
        this.observabilityService.warn(
          className,
          `Categoria '${id}' está sendo usada por produtos e não pode ser excluída (org: '${org_id}').`,
        );
        throw new ConflictException(
          'Category is being used by products and cannot be deleted',
        );
      }

      await this.catContract.delete(id);
      this.observabilityService.log(
        className,
        `Categoria '${id}' excluída com sucesso da organização '${org_id}'.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao excluir categoria '${id}' da organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
