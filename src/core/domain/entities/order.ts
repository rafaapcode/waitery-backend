import { Product } from './product';

export enum OrderStatus {
  WAITING = 'WAITING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

type ProductsOrder = {
  image_url?: string;
  name: string;
  quantity: number;
  price: number;
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
    this.status = data.status;
    this.deleted_at = data.deleted_at;
    this.created_at = data.created_at ?? new Date();
    this.total_price = data.total_price;
    this.quantity = data.quantity;
    this.table = data.table;
    this.products = data.products ?? [];
  }

  productMapper(): { quantity: number; price: number; product: Product }[] {
    const groupProductsOfAOrder = this.products.reduce((acc, curr) => {
      if (curr.id && acc.has(curr.id)) {
        const product = acc.get(curr.id);
        if (product) {
          product.quantity = product.quantity += 1;
          product.price = product.price += curr.price;
          acc.set(curr.id, product);
        }
      } else {
        if (curr.id) {
          acc.set(curr.id, {
            quantity: 1,
            price: curr.price,
            product: curr,
          });
        }
      }

      return acc;
    }, new Map<string, { quantity: number; price: number; product: Product }>());

    return Array.from(groupProductsOfAOrder.values());
  }

  totalQuantityAndPrice(): { quantity: number; total_price: number } {
    const products = this.productMapper();

    return products.reduce(
      (acc, curr) => {
        acc.quantity += curr.quantity;
        acc.total_price += curr.price;
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
    status: OrderStatus;
    deleted_at?: Date;
    created_at?: Date;
    total_price: number;
    quantity: number;
    table: string;
    products?: Product[];
  };
}

export const createOrderEntity = (data: Order.Attr): Order => new Order(data);
