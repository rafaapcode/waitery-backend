import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IINGREDIENT_CONTRACT } from 'src/shared/constants';

interface IGetAllIngredientUseCase {
  execute(): Promise<Ingredient[]>;
}

@Injectable()
export class GetAllIngredientUseCase implements IGetAllIngredientUseCase {
  constructor(
    @Inject(IINGREDIENT_CONTRACT)
    private readonly ingContract: IIngredientContract,
    private readonly observabilityService: ObservabilityService,
  ) {}
  async execute(): Promise<Ingredient[]> {
    const className = GetAllIngredientUseCase.name;
    this.observabilityService.log(
      className,
      'Iniciando busca de todos os ingredientes.',
    );
    try {
      const ings = await this.ingContract.getAll();
      if (ings.length === 0) {
        this.observabilityService.warn(
          className,
          'Nenhum ingrediente encontrado.',
        );
        throw new NotFoundException('Ingredients not Found');
      }
      this.observabilityService.log(
        className,
        `Busca de ingredientes realizada com sucesso. Total encontrado: ${ings.length}`,
      );
      return ings;
    } catch (error) {
      this.observabilityService.error(
        className,
        'Erro ao buscar ingredientes.',
        '',
      );
      throw error;
    }
  }
}
