import { Category } from './category';
import { Ingredient } from './ingredient';

export class Product {
  readonly id?: string;
  readonly org_id: string;
  readonly name: string;
  readonly description: string;
  readonly image_url: string;
  readonly price: number;
  readonly ingredients: Ingredient[];
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
    this.discounted_price = data.discounted_price;
    this.discount = data.discount;
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
    ingredients: Ingredient[];
    category: Category;
    discounted_price: number;
    discount: boolean;
  };
}

export const createProductEntity = (data: Product.Attr): Product =>
  new Product(data);
