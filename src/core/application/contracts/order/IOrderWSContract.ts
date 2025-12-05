import { Order } from 'src/core/domain/entities/order';

export interface IOrderWSContract {
  emitCreateOrder: (data: IOrderWSContract.CreateParams) => void;
}

export namespace IOrderWSContract {
  export type CreateParams = {
    event: string;
    data: { action: string; order: Order };
  };
}
