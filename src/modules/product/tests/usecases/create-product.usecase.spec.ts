import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { Product } from 'src/core/domain/entities/product';
import { PrismaService } from 'src/infra/database/database.service';
import { CategoryService } from 'src/modules/category/category.service';
import { CategoryRepository } from 'src/modules/category/repo/category.repository';
import { IngredientService } from 'src/modules/ingredient/ingredient.service';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  ICATEGORY_CONTRACT,
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { CreateProductDto } from '../../dto/create-product.dto';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { CreateProductUseCase } from '../../usecases/CreateProductUseCase';

describe('Create Product Usecase', () => {
  let createProductUseCase: CreateProductUseCase;
  let productService: IProductContract;
  let catService: ICategoryContract;
  let catRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let ingService: IIngredientContract;
  let ingRepo: IngredientRepository;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  const owner_id = 'owner_id';
  let org_id: string;
  let cat_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductUseCase,
        CategoryRepository,
        ProductRepository,
        IngredientRepository,
        OrganizationRepo,
        PrismaService,
        {
          provide: IPRODUCT_CONTRACT,
          useClass: ProductService,
        },
        {
          provide: ICATEGORY_CONTRACT,
          useClass: CategoryService,
        },
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
      ],
    }).compile();

    createProductUseCase =
      modules.get<CreateProductUseCase>(CreateProductUseCase);

    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    catService = modules.get<CategoryService>(ICATEGORY_CONTRACT);
    catRepo = modules.get<CategoryRepository>(CategoryRepository);
    ingService = modules.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingRepo = modules.get<IngredientRepository>(IngredientRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    prismaService = modules.get<PrismaService>(PrismaService);

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

    const [ing1, ing2, ing3, ing4] = await Promise.all([
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 1',
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 2',
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 3',
        },
      }),
      prismaService.ingredient.create({
        data: {
          icon: '🥗',
          name: 'ing 4',
        },
      }),
    ]);

    org_id = id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat_id = cat_id_db;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({ where: { name: 'name' } });
    await prismaService.category.deleteMany({ where: { name: 'Massas' } });
    await prismaService.ingredient.deleteMany({
      where: { icon: '🥗' },
    });
    await prismaService.organization.deleteMany({
      where: { owner_id },
    });
  });

  it('Should all services be defined', () => {
    expect(createProductUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(catService).toBeDefined();
    expect(catRepo).toBeDefined();
    expect(ingService).toBeDefined();
    expect(ingRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(ing_ids.length).toBe(4);
  });

  it('Should create a new product', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat_id,
      description: 'description',
      image_url: 'image_url',
      name: 'name',
      ingredients: ing_ids,
      org_id,
      price: 120,
    };

    // Act
    const product = await createProductUseCase.execute(data);

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(product.ingredients.length).toBe(4);
    expect(product.category.name).toBe('Massas');
  });

  it('Should throw an error if the category does not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: 'cat_id',
      description: 'description',
      image_url: 'image_url',
      name: 'name',
      ingredients: ing_ids,
      org_id,
      price: 120,
    };

    // Assert
    await expect(createProductUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the ingredients doest not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: 'cat_id',
      description: 'description',
      image_url: 'image_url',
      name: 'name',
      ingredients: [],
      org_id,
      price: 120,
    };

    // Assert
    await expect(createProductUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the ingredients os greater then the ingredients on the db', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: 'cat_id',
      description: 'description',
      image_url: 'image_url',
      name: 'name',
      ingredients: [...ing_ids, 'ing_id'],
      org_id,
      price: 120,
    };

    // Assert
    await expect(createProductUseCase.execute(data)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('Should throw an error if the org does not exists', async () => {
    // Arrange
    const data: CreateProductDto = {
      category_id: cat_id,
      description: 'description',
      image_url: 'image_url',
      name: 'name',
      ingredients: ing_ids,
      org_id: 'org_id',
      price: 120,
    };

    // Assert
    await expect(createProductUseCase.execute(data)).rejects.toThrow(
      NotFoundException,
    );
  });
});
