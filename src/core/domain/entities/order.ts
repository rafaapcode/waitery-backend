import { Prisma } from 'generated/prisma';

export enum OrderStatus {
  WAITING = 'WAITING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export type ProductsOrder = {
  image_url?: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  discount: boolean;
};

export class Order {
  id?: string;
  readonly org_id: string;
  readonly user_id: string;
  readonly status: OrderStatus;
  readonly deleted_at?: Date;
  readonly created_at: Date;
  readonly total_price: number;
  readonly quantity: number;
  readonly table: string;
  readonly products: ProductsOrder[];

  constructor(data: Order.Attr) {
    if (data.id) this.id = data.id;
    this.org_id = data.org_id;
    this.user_id = data.user_id;
    this.status = data.status ?? OrderStatus.WAITING;
    this.deleted_at = data.deleted_at;
    this.created_at = data.created_at ?? new Date();
    this.total_price = data.total_price;
    this.quantity = data.quantity;
    this.table = data.table;
    this.products = data.products ?? [];
  }

  productsToPrismaJson(): Prisma.JsonArray {
    return this.products as Prisma.JsonArray;
  }

  static productsFromPrismaJson(products: Prisma.JsonArray): ProductsOrder[] {
    if (
      products &&
      typeof products === 'object' &&
      Array.isArray(products) &&
      products.length > 0
    ) {
      return products as ProductsOrder[];
    }

    return [];
  }

  static totalQuantityAndPrice(data: { quantity: number; price: number }[]): {
    quantity: number;
    total_price: number;
  } {
    return data.reduce(
      (acc, curr) => {
        acc.quantity += curr.quantity;
        acc.total_price += curr.price * curr.quantity;
        return acc;
      },
      { quantity: 0, total_price: 0 },
    );
  }
}

namespace Order {
  export type Attr = {
    id?: string;
    org_id: string;
    user_id: string;
    status?: OrderStatus;
    deleted_at?: Date;
    created_at?: Date;
    total_price: number;
    quantity: number;
    table: string;
    products?: ProductsOrder[];
  };
}

export const createOrderEntity = (data: Order.Attr): Order => new Order(data);
