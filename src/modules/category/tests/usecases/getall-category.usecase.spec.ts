import { NotFoundException } from '@nestjs/common';
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
import { GetAllCategoryUseCase } from '../../usecases/GetAllCategoryUseCase';

describe('GetAll Categories UseCase', () => {
  let getAllCategoriesUseCase: GetAllCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;
  let org_id2: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllCategoryUseCase,
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

    getAllCategoriesUseCase = module.get<GetAllCategoryUseCase>(
      GetAllCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<CategoryService>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    orgRepo = module.get<OrganizationRepo>(OrganizationRepo);
    orgService = module.get<OrganizationService>(IORGANIZATION_CONTRACT);

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

    const { id: org2_id } = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão2',
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

    await prismaService.category.createMany({
      data: Array.from({ length: 20 }).map((_, idx) => ({
        icon: '🍏',
        name: `Massas ${idx}`,
        org_id: id,
      })),
    });

    org_id = id;
    org_id2 = org2_id;
  });

  afterAll(async () => {
    await prismaService.category.deleteMany({
      where: {
        org_id,
      },
    });
    await prismaService.organization.delete({
      where: {
        id: org_id,
      },
    });
    await prismaService.organization.delete({
      where: {
        id: org_id2,
      },
    });
  });

  it('Should all services be defined', () => {
    expect(getAllCategoriesUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
  });

  it('Should get all categories of a org', async () => {
    // Act
    const allCats = await getAllCategoriesUseCase.execute(org_id);

    // Assert
    expect(allCats.length).toBe(20);
    expect(allCats[0]).toBeInstanceOf(Category);
  });

  it('Should get an empty array if the org has not categories', async () => {
    // Act
    const allCats = await getAllCategoriesUseCase.execute(org_id2);

    // Assert
    expect(allCats.length).toBe(0);
    expect(allCats[0]).toBeUndefined();
    expect(allCats).toMatchObject([]);
  });

  it('Should throw a NotFoundException if the Org does not exists', async () => {
    // Assert
    await expect(getAllCategoriesUseCase.execute('org_id2')).rejects.toThrow(
      NotFoundException,
    );
  });
});
