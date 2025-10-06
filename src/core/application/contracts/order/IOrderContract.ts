import { Order, ProductsOrder } from 'src/core/domain/entities/order';

export interface IOrderContract {
  create: (
    data: IOrderContract.CreateParams,
  ) => Promise<IOrderContract.CreateOutput>;
  cancelOrder: (
    order_id: IOrderContract.DeleteParams,
  ) => Promise<IOrderContract.DeleteOutput>;
  deleteOrder: (
    order_id: IOrderContract.DeleteParams,
  ) => Promise<IOrderContract.DeleteOutput>;
  updateOrderStatus: (
    params: IOrderContract.UpdateOrderStatusParams,
  ) => Promise<IOrderContract.UpdateOrderStatusOutput>;
  getOrder: (
    id: IOrderContract.GetOrderParams,
  ) => Promise<IOrderContract.GetOrderOutput>;
  getProductsOfOrder: (
    products_id: IOrderContract.GetProductsOfOrdersParams,
  ) => Promise<IOrderContract.GetProductsOfOrdersOutput>;
  getAllOrders: (
    params: IOrderContract.GetAllOrdersOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfOrgOutput>;
  getAllOrdersOfToday: (
    params: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput>;
  verifyOrderByOrg: (
    params: IOrderContract.VerifyOrgOrderParams,
  ) => Promise<IOrderContract.VerifyOrgOrdersOutput>;
  verifyOrderByUser: (
    params: IOrderContract.VerifyUserOrderParams,
  ) => Promise<IOrderContract.VerifyUserOrdersOutput>;
}

export namespace IOrderContract {
  enum OrderStatus {
    WAITING = 'WAITING',
    IN_PRODUCTION = 'IN_PRODUCTION',
    DONE = 'DONE',
    CANCELED = 'CANCELED',
  }

  export type CreateParams = {
    product_ids: string[];
    order: Order;
  };
  export type CreateOutput = Order;

  export type DeleteParams = string;
  export type DeleteOutput = void;

  export type GetAllOrdersOfOrgParams = {
    org_id: string;
    page?: number;
  };
  export type GetAllOrdersOfOrgOutput = {
    orders: Order[];
    has_next: boolean;
  };

  export type GetOrderParams = string;
  export type GetOrderOutput = Order | null;

  export type GetProductsOfOrdersParams = string[];
  export type GetProductsOfOrdersOutput = ProductsOrder[];

  export type GetAllOrdersOfTodayOfOrgParams = string;
  export type GetAllOrdersOfTodayOfOrgOutput = Order[];

  export type UpdateOrderStatusParams = {
    order_id: string;
    status: OrderStatus;
  };
  export type UpdateOrderStatusOutput = void;

  export type VerifyOrgOrderParams = {
    order_id: string;
    org_id: string;
  };
  export type VerifyOrgOrdersOutput = boolean;

  export type VerifyUserOrderParams = {
    order_id: string;
    user_id: string;
  };
  export type VerifyUserOrdersOutput = boolean;
}
