import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';

interface IDeleteIngredientUseCase {
  execute(id: string): Promise<void>;
}

@Injectable()
export class DeleteIngredientUseCase implements IDeleteIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string): Promise<void> {
    const className = DeleteIngredientUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando exclusão do ingrediente '${id}'.`,
    );
    try {
      const ingExists = await this.ingContract.get(id);
      if (!ingExists) {
        this.observabilityService.warn(
          className,
          `Ingrediente '${id}' não existe para exclusão.`,
        );
        throw new NotFoundException('Ingredient does not exist');
      }
      await this.ingContract.delete(id);
      this.observabilityService.log(
        className,
        `Ingrediente '${id}' excluído com sucesso.`,
      );
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao excluir ingrediente '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
