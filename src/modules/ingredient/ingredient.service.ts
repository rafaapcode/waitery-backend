import { Injectable } from '@nestjs/common';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { Ingredient } from 'src/core/domain/entities/ingredient';
import { IngredientRepository } from './repo/ingredient.repository';

@Injectable()
export class IngredientService implements IIngredientContract {
  constructor(private readonly ingredientRepo: IngredientRepository) {}

  async create(
    data: IIngredientContract.CreateParams,
  ): Promise<IIngredientContract.CreateOutput> {
    const ing = await this.ingredientRepo.create(data);

    return new Ingredient(ing);
  }
  async update(
    data: IIngredientContract.UpdateParams,
  ): Promise<IIngredientContract.UpdateOutput> {
    const ing = await this.ingredientRepo.update(data);

    return new Ingredient(ing);
  }
  async delete(
    data: IIngredientContract.DeleteParams,
  ): Promise<IIngredientContract.DeleteOutput> {
    await this.ingredientRepo.delete(data);
  }
  async get(
    data: IIngredientContract.GetIngredientParams,
  ): Promise<IIngredientContract.GetIngredientOutput> {
    const ing = await this.ingredientRepo.getById(data);

    if (!ing) return null;

    return new Ingredient(ing);
  }
  async getAll(): Promise<IIngredientContract.GetAllIngredientsOutput> {
    const ings = await this.ingredientRepo.getAll();

    return ings.map((ing) => new Ingredient(ing));
  }

  async getByName(
    name: IIngredientContract.GetIngredientsByNameParams,
  ): Promise<IIngredientContract.GetIngredientsByNameOutput> {
    const ing = await this.ingredientRepo.getByName(name);

    if (!ing) return null;

    return new Ingredient(ing);
  }
}
