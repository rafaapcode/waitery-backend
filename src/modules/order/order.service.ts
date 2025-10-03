import { Injectable } from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';

@Injectable()
export class OrderService implements IOrderContract {
  create(
    data: IOrderContract.CreateParams,
  ): Promise<IOrderContract.CreateOutput> {
    throw new Error('Method not implemented');
  }
  delete(
    data: IOrderContract.DeleteParams,
  ): Promise<IOrderContract.DeleteOutput> {
    throw new Error('Method not implemented');
  }
  getOrder(
    id: IOrderContract.GetOrderParams,
  ): Promise<IOrderContract.GetOrderOutput> {
    throw new Error('Method not implemented');
  }
  getAllOrders(
    org_id: IOrderContract.GetAllOrdersOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfOrgOutput> {
    throw new Error('Method not implemented');
  }
  getAllOrdersOfToday(
    org_id: IOrderContract.GetAllOrdersOfTodayOfOrgParams,
  ): Promise<IOrderContract.GetAllOrdersOfTodayOfOrgOutput> {
    throw new Error('Method not implemented');
  }
}
