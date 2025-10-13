import { Prisma } from 'generated/prisma';
import { Category } from './category';
import { ProductsOrder } from './order';

export class Product {
  readonly id?: string;
  readonly org_id: string;
  readonly name: string;
  readonly description: string;
  readonly image_url: string;
  readonly price: number;
  readonly ingredients: string[];
  readonly category: Category;
  readonly discounted_price: number;
  readonly discount: boolean;

  constructor(data: Product.Attr) {
    if (data.id) this.id = data.id;
    this.org_id = data.org_id;
    this.name = data.name;
    this.description = data.description;
    this.image_url = data.image_url;
    this.price = data.price;
    this.ingredients = data.ingredients;
    this.category = data.category;
    this.discounted_price = data.discounted_price ?? 0;
    this.discount = data.discount ?? false;
  }

  static toCategoryIngredients(data: Prisma.JsonArray): string[] {
    if (
      data &&
      typeof data === 'object' &&
      Array.isArray(data) &&
      data.length > 0
    ) {
      return data as string[];
    }

    return [];
  }

  ingredientsCategoryToPrismaJson(): Prisma.JsonArray {
    return this.ingredients as Prisma.JsonArray;
  }

  toOrderType(quantity: number = 1): ProductsOrder {
    return {
      category: `${this.category.icon} ${this.category.name}`,
      discount: this.discount,
      name: this.name,
      price: this.discount ? this.discounted_price : this.price,
      quantity: quantity,
      image_url: this.image_url ?? '',
    };
  }
}

namespace Product {
  export type Attr = {
    id?: string;
    org_id: string;
    name: string;
    description: string;
    image_url: string;
    price: number;
    ingredients: string[];
    category: Category;
    discounted_price?: number;
    discount?: boolean;
  };
}

export const createProductEntity = (data: Product.Attr): Product =>
  new Product(data);
