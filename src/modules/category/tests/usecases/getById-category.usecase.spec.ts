import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { GetByIdCategoryUseCase } from '../../usecases/GetByIdCategoryUseCase';

describe('Get Category by Id UseCase', () => {
  let getByIdCategoryUseCase: GetByIdCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;
  let cat_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetByIdCategoryUseCase,
        PrismaService,
        CategoryRepository,
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
        },
      ],
    }).compile();

    getByIdCategoryUseCase = module.get<GetByIdCategoryUseCase>(
      GetByIdCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<ICategoryContract>(ICATEGORY_CONTRACT);
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);

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

    const { id: cat_id_db } = await prismaService.category.create({
      data: {
        icon: '🍏',
        name: 'Massas',
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.category.delete({
      where: {
        id: cat_id,
      },
    });
    await prismaService.organization.delete({
      where: {
        id: org_id,
      },
    });
  });

  it('Should all services be defined', () => {
    expect(getByIdCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
  });

  it('Should get the category by id', async () => {
    // Act
    const cat = await getByIdCategoryUseCase.execute(cat_id);

    // Assert
    expect(cat).toBeInstanceOf(Category);
    expect(cat.id).toBeDefined();
    expect(cat.org_id).toBeDefined();
  });

  it('Should throw an NotFoundException if the category does not exists', async () => {
    // Assert
    await expect(getByIdCategoryUseCase.execute('cat_id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
