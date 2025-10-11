import { Injectable } from '@nestjs/common';
import { Product } from 'generated/prisma';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { PrismaService } from 'src/infra/database/database.service';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IProductContract.CreateParams): Promise<Product> {
    const product = await this.prisma.product.create({
      data,
    });

    return product;
  }

  async update(data: IProductContract.UpdateParams): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id: data.id },
      data: data.data,
    });

    return product;
  }

  async delete(product_id: IProductContract.DeleteParams): Promise<void> {
    await this.prisma.product.delete({
      where: { id: product_id },
    });
  }

  async get(product_id: IProductContract.GetParams): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
    });

    return product;
  }

  async getAll(params: IProductContract.GetAllParams): Promise<Product[]> {
    const product = await this.prisma.product.findMany({
      where: { org_id: params.org_id },
    });

    return product;
  }

  async verifyOrgById(
    params: IProductContract.VerifyOrgsParamsById,
  ): Promise<boolean> {
    const product = await this.prisma.userOrg.findFirst({
      where: {
        org_id: params.org_id,
        user_id: params.user_id,
      },
    });

    return product !== null;
  }
}
