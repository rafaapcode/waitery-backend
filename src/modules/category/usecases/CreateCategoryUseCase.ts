import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import {
  Category,
  createCategoryEntity,
} from 'src/core/domain/entities/category';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
} from 'src/shared/constants';
import { CreateCategoryDto } from '../dto/create-category.dto';

interface ICreateCategoryUseCase {
  execute(data: { org_id: string; data: CreateCategoryDto }): Promise<Category>;
}

@Injectable()
export class CreateCategoryUseCase implements ICreateCategoryUseCase {
  constructor(
    @Inject(ICATEGORY_CONTRACT)
    private readonly catContract: ICategoryContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
  ) {}

  async execute({
    org_id,
    data,
  }: {
    org_id: string;
    data: CreateCategoryDto;
  }): Promise<Category> {
    const catAlreadyExists = await this.catContract.getCategoryByName({
      org_id,
      name: data.name,
    });

    if (catAlreadyExists) {
      throw new ConflictException('Category already exists');
    }

    const orgExists = await this.orgContract.get({
      id: org_id,
    });

    if (!orgExists) {
      throw new NotFoundException('Org not found');
    }

    const categoryEntity = createCategoryEntity({
      org_id,
      ...data,
    });

    const cat = await this.catContract.create(categoryEntity);

    return cat;
  }
}
