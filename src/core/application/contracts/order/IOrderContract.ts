import { Order } from 'src/core/domain/entities/order';

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
  getAllOrders: (
    params: IOrderContract.GetAllOrdersOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfOrgOutput>;
  getAllOrdersOfToday: (
    params: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput>;
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

  export type GetAllOrdersOfTodayOfOrgParams = string;
  export type GetAllOrdersOfTodayOfOrgOutput = Order[];

  export type UpdateOrderStatusParams = {
    order_id: string;
    status: OrderStatus;
  };
  export type UpdateOrderStatusOutput = void;
}
