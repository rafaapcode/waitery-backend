import { Inject, Injectable } from '@nestjs/common';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IPRODUCT_CONTRACT } from 'src/shared/constants';

interface IDeleteProductUseCase {
  execute(product_id: string): Promise<void>;
}

@Injectable()
export class DeleteProductUseCase implements IDeleteProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
  ) {}

  async execute(product_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
