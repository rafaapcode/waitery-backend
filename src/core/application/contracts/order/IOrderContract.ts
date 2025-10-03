import { Order } from 'src/core/domain/entities/order';

export interface IOrderContract {
  create: (
    data: IOrderContract.CreateParams,
  ) => Promise<IOrderContract.CreateOutput>;
  delete: (
    data: IOrderContract.DeleteParams,
  ) => Promise<IOrderContract.DeleteOutput>;
  getOrder: (
    id: IOrderContract.GetOrderParams,
  ) => Promise<IOrderContract.GetOrderOutput>;
  getAllOrders: (
    org_id: IOrderContract.GetAllOrdersOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfOrgOutput>;
  getAllOrdersOfToday: (
    org_id: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ) => Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput>;
}

export namespace IOrderContract {
  export type CreateParams = Order;
  export type CreateOutput = Order;

  export type DeleteParams = string;
  export type DeleteOutput = void;

  export type GetAllOrdersOfOrgParams = string;
  export type GetAllOrdersOfOrgOutput = Order[];

  export type GetOrderParams = string;
  export type GetOrderOutput = Order | null;

  export type GetAllOrdersOfTodayOfOrgParams = string;
  export type GetAllOrdersOfTodayOfOrgOutput = Order[];
}
