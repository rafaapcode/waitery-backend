import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';

interface IDeleteIngredientUseCase {
  execute(id: string): Promise<void>;
}

@Injectable()
export class DeleteIngredientUseCase implements IDeleteIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
  ) {}

  async execute(id: string): Promise<void> {
    const ingExists = await this.ingContract.get(id);
    if (!ingExists) throw new NotFoundException('Ingredient does not exist');
    await this.ingContract.delete(id);
  }
}
