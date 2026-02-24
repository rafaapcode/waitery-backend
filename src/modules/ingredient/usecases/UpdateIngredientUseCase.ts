import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';

interface IUpdateIngredientUseCase {
  execute({
    id,
    data,
  }: {
    id: string;
    data: UpdateIngredientDto;
  }): Promise<Ingredient>;
}

@Injectable()
export class UpdateIngredientUseCase implements IUpdateIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({
    id,
    data,
  }: {
    id: string;
    data: UpdateIngredientDto;
  }): Promise<Ingredient> {
    const className = UpdateIngredientUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando atualização do ingrediente '${id}'.`,
    );
    try {
      const ing_exists = await this.ingContract.get(id);
      if (!ing_exists) {
        this.observabilityService.warn(
          className,
          `Ingrediente '${id}' não encontrado para atualização.`,
        );
        throw new NotFoundException('Ingredient not found');
      }
      this.observabilityService.log(
        className,
        `Persistindo atualização do ingrediente '${id}'.`,
      );
      const updated_ing = await this.ingContract.update({
        id,
        ingredient: {
          ...data,
          ...(data.name && { name: data.name.toLowerCase() }),
        },
      });
      this.observabilityService.log(
        className,
        `Ingrediente '${id}' atualizado com sucesso.`,
      );
      return updated_ing;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao atualizar ingrediente '${id}'.`,
        '',
      );
      throw error;
    }
  }
}
