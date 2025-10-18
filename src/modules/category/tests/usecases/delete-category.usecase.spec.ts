import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { DeleteCategoryUseCase } from '../../usecases/DeleteCategoryUseCase';

describe('Delete Category UseCase', () => {
  let deleteCategoryUseCAse: DeleteCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;
  let category_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        PrismaService,
        CategoryRepository,
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
        },
      ],
    }).compile();

    deleteCategoryUseCAse = module.get<DeleteCategoryUseCase>(
      DeleteCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);

    const { id: org_id_db } = await prismaService.organization.create({
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

    const { id: cat_id_db } = await prismaService.category.create({
      data: {
        icon: '🍏',
        name: 'Massas',
        org_id: org_id_db,
      },
    });

    org_id = org_id_db;
    category_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.organization.deleteMany({
      where: {
        name: 'Restaurante Fogo de chão',
      },
    });
  });

  it('Should all services be defined', () => {
    expect(deleteCategoryUseCAse).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(category_id).toBeDefined();
  });

  it('Should throw an error if the category does not exists', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute('category_id', org_id),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the organization does not match', async () => {
    //Assert
    await expect(
      deleteCategoryUseCAse.execute(category_id, 'wrong_org_id'),
    ).rejects.toThrow(BadRequestException);
  });

  it('Should delete a category', async () => {
    // Arrange
    const old_cat = await prismaService.category.findUnique({
      where: { id: category_id },
    });

    // Act
    await deleteCategoryUseCAse.execute(category_id, org_id);
    const actual_cat = await prismaService.category.findUnique({
      where: { id: category_id },
    });

    //Assert
    expect(old_cat).toBeDefined();
    expect(actual_cat).toBeNull();
  });
});
