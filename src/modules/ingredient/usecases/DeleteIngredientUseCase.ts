import { Inject, Injectable } from '@nestjs/common';
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

  execute(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
