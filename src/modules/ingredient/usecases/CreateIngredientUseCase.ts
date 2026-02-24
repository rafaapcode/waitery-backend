import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import {
  createIngredientEntity,
  Ingredient,
} from 'src/core/domain/entities/ingredient';
import { ObservabilityService } from 'src/infra/observability/observability.service';
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
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(data: CreateIngredientDto): Promise<Ingredient> {
    const className = CreateIngredientUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando criação do ingrediente '${data.name}'.`,
    );
    try {
      const ingExists = await this.ingContract.getByName(
        data.name.toLowerCase(),
      );
      if (ingExists) {
        this.observabilityService.warn(
          className,
          `Ingrediente '${data.name}' já existe.`,
        );
        throw new ConflictException('Ingredient alredy exists');
      }
      this.observabilityService.log(
        className,
        `Persistindo ingrediente '${data.name}'.`,
      );
      const ing = await this.ingContract.create(
        createIngredientEntity({
          ...data,
          name: data.name.toLowerCase(),
        }),
      );
      this.observabilityService.log(
        className,
        `Ingrediente '${data.name}' criado com sucesso.`,
      );
      return ing;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao criar ingrediente '${data?.name}'.`,
        '',
      );
      throw error;
    }
  }
}
