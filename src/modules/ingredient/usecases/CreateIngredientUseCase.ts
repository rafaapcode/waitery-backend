import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import {
  createIngredientEntity,
  Ingredient,
} from 'src/core/domain/entities/ingredient';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';

interface ICreateIngredientUseCase {
  execute(data: CreateIngredientDto): Promise<Ingredient>;
}

@Injectable()
export class CreateIngredientUseCase implements ICreateIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
  ) {}

  async execute(data: CreateIngredientDto): Promise<Ingredient> {
    const ingExists = await this.ingContract.getByName(data.name.toLowerCase());

    if (ingExists) throw new ConflictException('Ingredient alredy exists');

    const ing = await this.ingContract.create(
      createIngredientEntity({
        ...data,
        name: data.name.toLowerCase(),
      }),
    );

    return ing;
  }
}
