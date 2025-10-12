import { Inject, Injectable } from '@nestjs/common';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { IPRODUCT_CONTRACT } from 'src/shared/constants';

interface ICreateProductUseCase {
  execute(product: Product): Promise<void>;
}

@Injectable()
export class CreateProductUseCase implements ICreateProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
  ) {}

  async execute(product: Product): Promise<void> {
    throw new Error('Method not implemented');
  }
}
