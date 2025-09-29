export class Ingredient {
  readonly id?: string;
  readonly name: string;
  readonly icon: string;

  constructor(data: Ingredient.Attr) {
    if (data.id) this.id = data.id;
    this.name = data.name;
    this.icon = data.icon;
  }
}

namespace Ingredient {
  export type Attr = {
    id?: string;
    name: string;
    icon: string;
  };
}

export const createIngredientEntity = (data: Ingredient.Attr): Ingredient =>
  new Ingredient(data);
