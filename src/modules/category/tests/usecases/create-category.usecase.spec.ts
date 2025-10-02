import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  ICATEGORY_CONTRACT,
  IORGANIZATION_CONTRACT,
} from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { CreateCategoryUseCase } from '../../usecases/CreateCategoryUseCase';

describe('Create Category UseCase', () => {
  let createCategoryUseCase: CreateCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        PrismaService,
        CategoryRepository,
        OrganizationRepo,
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
      ],
    }).compile();

    createCategoryUseCase = module.get<CreateCategoryUseCase>(
      CreateCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<CategoryService>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    orgService = module.get<OrganizationService>(IORGANIZATION_CONTRACT);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);

    const { id } = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão',
        image_url: 'https://example.com/images/clinica.jpg',
        email: 'contato@bemestar.com',
        description:
          'Clínica especializada em atendimento psicológico e terapias.',
        location_code: 'BR-MG-015',
        open_hour: 8,
        close_hour: 18,
        cep: '30130-010',
        city: 'Belo Horizonte',
        neighborhood: 'Funcionários',
        street: 'Rua da Bahia, 1200',
        lat: -19.92083,
        long: -43.937778,
        owner_id,
      },
    });

    org_id = id;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({
      where: {
        name: 'Restaurante Fogo de chão',
      },
    });

    await prismaService.category.deleteMany({
      where: { name: 'Massas' },
    });
  });

  it('Should all services be defined', () => {
    expect(createCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
  });

  it('Should create a new category', async () => {
    // Arrange
    const data = {
      name: 'Massas',
      icon: '🍕',
    };

    // Act
    const newCat = await createCategoryUseCase.execute({
      org_id,
      data,
    });

    // Assert
    expect(newCat).toBeInstanceOf(Category);
    expect(newCat.id).toBeDefined();
  });

  it('Should throw an error if the category already exists in the org', async () => {
    // Arrange
    const data = {
      name: 'Massas',
      icon: '🍕',
    };

    // Assert
    await expect(
      createCategoryUseCase.execute({
        org_id,
        data,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('Should throw an error if the organization does not exists', async () => {
    // Arrange
    const data = {
      name: 'Massas',
      icon: '🍕',
    };

    // Assert
    await expect(
      createCategoryUseCase.execute({
        org_id: 'org_id',
        data,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
