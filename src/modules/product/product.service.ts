import { Injectable } from '@nestjs/common';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';

@Injectable()
export class ProductService implements IProductContract {
  create(
    params: IProductContract.CreateParams,
  ): Promise<IProductContract.CreateOutput> {
    throw new Error('Method not implemented.');
  }
  update(
    params: IProductContract.UpdateParams,
  ): Promise<IProductContract.UpdateOutput> {
    throw new Error('Method not implemented.');
  }
  delete(
    params: IProductContract.DeleteParams,
  ): Promise<IProductContract.DeleteOutput> {
    throw new Error('Method not implemented.');
  }
  get(params: IProductContract.GetParams): Promise<IProductContract.GetOutput> {
    throw new Error('Method not implemented.');
  }
  getAll(
    params: IProductContract.GetAllParams,
  ): Promise<IProductContract.GetAllOutput> {
    throw new Error('Method not implemented.');
  }
  verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<IProductContract.VerifyOrgsOutput> {
    throw new Error('Method not implemented.');
  }
}
