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
import { ObservabilityService } from 'src/infra/observability/observability.service';
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
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute({
    org_id,
    data,
  }: {
    org_id: string;
    data: CreateCategoryDto;
  }): Promise<Category> {
    const className = CreateCategoryUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando criação de categoria '${data.name}' para organização '${org_id}'.`,
    );
    try {
      const catAlreadyExists = await this.catContract.getCategoryByName({
        org_id,
        name: data.name,
      });
      if (catAlreadyExists) {
        this.observabilityService.warn(
          className,
          `Categoria '${data.name}' já existe na organização '${org_id}'.`,
        );
        throw new ConflictException('Category already exists');
      }

      const orgExists = await this.orgContract.get({
        id: org_id,
      });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${org_id}' não encontrada ao tentar criar categoria '${data.name}'.`,
        );
        throw new NotFoundException('Org not found');
      }

      const categoryEntity = createCategoryEntity({
        org_id,
        ...data,
      });

      this.observabilityService.log(
        className,
        `Persistindo categoria '${data.name}' para organização '${org_id}'.`,
      );
      const cat = await this.catContract.create(categoryEntity);
      this.observabilityService.log(
        className,
        `Categoria '${data.name}' criada com sucesso para organização '${org_id}'.`,
      );
      return cat;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao criar categoria '${data?.name}' para organização '${org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
