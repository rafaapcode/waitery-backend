import { Inject, Injectable } from '@nestjs/common';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { IPRODUCT_CONTRACT } from 'src/shared/constants';
import { CreateProductDto } from '../dto/create-product.dto';

interface ICreateProductUseCase {
  execute(product: CreateProductDto): Promise<Product>;
}

@Injectable()
export class CreateProductUseCase implements ICreateProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
  ) {}

  async execute(product: CreateProductDto): Promise<Product> {
    throw new Error('Method not implemented');
  }
}
