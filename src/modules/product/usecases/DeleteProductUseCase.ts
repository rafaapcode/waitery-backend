import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { UserRole } from 'src/core/domain/entities/user';
import {
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';

interface IDeleteProductUseCase {
  execute(
    product_id: string,
    org_id: string,
    user_id: string,
    role: UserRole,
  ): Promise<void>;
}

@Injectable()
export class DeleteProductUseCase implements IDeleteProductUseCase {
  constructor(
    @Inject(IPRODUCT_CONTRACT)
    private readonly prodService: IProductContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgService: IOrganizationContract,
  ) {}

  async execute(
    product_id: string,
    org_id: string,
    user_id: string,
    role: UserRole,
  ): Promise<void> {
    const isUserRelated = await this.prodService.verifyOrgById({
      org_id,
      user_id,
      user_role: role,
    });

    if (!isUserRelated) {
      throw new ConflictException('User not related with this organization');
    }

    const org = await this.orgService.get({ id: org_id });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const product = await this.prodService.get({ product_id, org_id });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.image_url) {
      // await this.prodService.deleteFile({});
    }
    await this.prodService.delete({ product_id, org_id });
  }
}
