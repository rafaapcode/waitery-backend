import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
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
  ) {}

  async execute({
    id,
    data,
  }: {
    id: string;
    data: UpdateIngredientDto;
  }): Promise<Ingredient> {
    const ing_exists = await this.ingContract.get(id);

    if (!ing_exists) throw new NotFoundException('Ingredient not found');

    const updated_ing = await this.ingContract.update({
      id,
      ingredient: {
        ...data,
        ...(data.name && { name: data.name.toLowerCase() }),
      },
    });

    return updated_ing;
  }
}
