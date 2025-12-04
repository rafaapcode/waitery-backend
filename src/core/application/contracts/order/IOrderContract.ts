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
    products_info: IOrderContract.GetProductsOfOrdersParams,
    org_id: string,
  ) => Promise<IOrderContract.GetProductsOfOrdersOutput>;
  getAllOrders: (
    params: IOrderContract.GetAllOrdersOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfOrgOutput>;
  getAllOrdersOfToday: (
    params: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput>;
  verifyOrderByUser: (
    params: IOrderContract.VerifyUserOrderParams,
  ) => Promise<IOrderContract.VerifyUserOrdersOutput>;
  getOrderOfUser: (
    user_id: IOrderContract.GetOrdersOfUserParams,
  ) => Promise<IOrderContract.GetOrdersOfUserOutput>;
  restartsTheOrdersOfDay: (org_id: string) => Promise<void>;
}

export namespace IOrderContract {
  enum OrderStatus {
    WAITING = 'WAITING',
    IN_PRODUCTION = 'IN_PRODUCTION',
    DONE = 'DONE',
    CANCELED = 'CANCELED',
  }

  export type CreateParams = Order;
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

  export type GetOrdersOfUserParams = {
    user_id: string;
    page?: number;
  };
  export type GetOrdersOfUserOutput = {
    orders: Order[];
    has_next: boolean;
  };

  export type GetProductsOfOrdersParams = {
    product_id: string;
    quantity: number;
  }[];
  export type GetProductsOfOrdersOutput = ProductsOrder[];

  export type GetAllOrdersOfTodayOfOrgParams = {
    org_id: string;
    orders_canceled?: boolean;
  };
  export type GetAllOrdersOfTodayOfOrgOutput = Order[];

  export type UpdateOrderStatusParams = {
    order_id: string;
    status: OrderStatus;
  };
  export type UpdateOrderStatusOutput = void;

  export type VerifyUserOrderParams = {
    order_id: string;
    user_id: string;
  };
  export type VerifyUserOrdersOutput = boolean;
}
