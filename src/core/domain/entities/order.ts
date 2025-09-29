import { Product } from './product';

export enum OrderStatus {
  WAITING = 'WAITING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  DONE = 'DONE',
}

export class Order {
  readonly id?: string;
  readonly org_id: string;
  readonly user_id: string;
  readonly status: OrderStatus;
  readonly deleted_at: Date;
  readonly created_at: Date;
  readonly total_price: number;
  readonly quantity: number;
  readonly table: string;
  readonly products: Product[];

  constructor(data: Order.Attr) {
    if (data.id) this.id = data.id;
    this.org_id = data.org_id;
    this.user_id = data.user_id;
    this.status = data.status;
    this.deleted_at = data.deleted_at;
    this.created_at = data.created_at;
    this.total_price = data.total_price;
    this.quantity = data.quantity;
    this.table = data.table;
    this.products = data.products;
  }
}

namespace Order {
  export type Attr = {
    id?: string;
    org_id: string;
    user_id: string;
    status: OrderStatus;
    deleted_at: Date;
    created_at: Date;
    total_price: number;
    quantity: number;
    table: string;
    products: Product[];
  };
}

export const createOrderEntity = (data: Order.Attr): Order => new Order(data);
