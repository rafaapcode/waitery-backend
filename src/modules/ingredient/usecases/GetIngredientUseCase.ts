import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';

interface IGetIngredientUseCase {
  execute(id: string): Promise<Ingredient>;
}

@Injectable()
export class GetIngredientUseCase implements IGetIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(id: string): Promise<Ingredient> {
    const className = GetIngredientUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando busca do ingrediente '${id}'.`,
    );
    try {
      const ing = await this.ingContract.get(id);
      if (!ing) {
        this.observabilityService.warn(
          className,
          `Ingrediente '${id}' não encontrado.`,
        );
        throw new NotFoundException('Ingredient not found');
      }
      this.observabilityService.log(
        className,
        `Ingrediente '${id}' encontrado com sucesso.`,
      );
      return new Ingredient(ing);
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao buscar ingrediente '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
