import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { Category } from 'src/core/domain/entities/category';
import { PrismaService } from 'src/infra/database/database.service';
import { ICATEGORY_CONTRACT } from 'src/shared/constants';
import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../repo/category.repository';
import { UpdateCategoryUseCase } from '../../usecases/UpdateCategoryUseCase';

describe('Update Category UseCase', () => {
  let updateCategoryUseCase: UpdateCategoryUseCase;
  let categoryService: ICategoryContract;
  let categoryRepo: CategoryRepository;
  let prismaService: PrismaService;
  const owner_id = 'testestes123131';
  let org_id: string;
  let cat_id: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
        PrismaService,
        CategoryRepository,
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
        },
      ],
    }).compile();

    updateCategoryUseCase = module.get<UpdateCategoryUseCase>(
      UpdateCategoryUseCase,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    categoryService = module.get<CategoryService>(ICATEGORY_CONTRACT);
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
    expect(updateCategoryUseCase).toBeDefined();
    expect(categoryService).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(categoryRepo).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
  });

  it('Should update ONLY THE ICON of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        icon: '🌶️',
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat_id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat_id);
    expect(updated_cat.org_id).toBe(org_id);
    expect(updated_cat.icon).not.toBe(old_cat?.icon);
  });

  it('Should update ONLY THE NAME of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: 'Gorduroso',
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat_id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat_id);
    expect(updated_cat.org_id).toBe(org_id);
    expect(updated_cat.name).not.toBe(old_cat?.name);
  });

  it('Should update THE BOTH FIELDS of a category', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: 'Saudável',
        icon: '🍽️',
      },
    };
    const old_cat = await prismaService.category.findUnique({
      where: { id: cat_id },
    });

    // Act
    const updated_cat = await updateCategoryUseCase.execute(
      data.id,
      data.category,
    );

    // Assert
    expect(updated_cat).toBeInstanceOf(Category);
    expect(updated_cat.id).toBe(cat_id);
    expect(updated_cat.org_id).toBe(org_id);
    expect(updated_cat.name).not.toBe(old_cat?.name);
    expect(updated_cat.icon).not.toBe(old_cat?.icon);
  });

  it('Should throw a NotFoundException if the category does not exist', async () => {
    // Arrange
    const data: ICategoryContract.UpdateParams = {
      id: cat_id,
      category: {
        name: 'Saudável',
        icon: '🍽️',
      },
    };

    // Assert
    await expect(
      updateCategoryUseCase.execute('data.id', data.category),
    ).rejects.toThrow(NotFoundException);
  });
});
