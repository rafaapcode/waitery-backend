import { Injectable } from '@nestjs/common';
import { Ingredient } from 'generated/prisma';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class IngredientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IIngredientContract.CreateParams): Promise<Ingredient> {
    const ingredient = await this.prisma.ingredient.create({
      data: {
        icon: data.icon,
        name: data.name,
      },
    });

    return ingredient;
  }

  async getAll(): Promise<Ingredient[]> {
    const allIngredients = await this.prisma.ingredient.findMany({});

    return allIngredients;
  }

  async getById(
    id: IIngredientContract.GetIngredientParams,
  ): Promise<Ingredient | null> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: {
        id,
      },
    });

    return ingredient;
  }

  async update(data: IIngredientContract.UpdateParams): Promise<Ingredient> {
    const ingredientUpdated = await this.prisma.ingredient.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.ingredient.icon && { icon: data.ingredient.icon }),
        ...(data.ingredient.name && { name: data.ingredient.name }),
      },
    });

    return ingredientUpdated;
  }

  async delete(id: IIngredientContract.DeleteParams): Promise<void> {
    await this.prisma.ingredient.delete({ where: { id } });
  }
}
