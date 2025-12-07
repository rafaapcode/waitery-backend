import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { ICategoryContract } from 'src/core/application/contracts/category/ICategoryContract';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { IUtilsContract } from 'src/core/application/contracts/utils/IUtilsContract';
import { UserRole } from 'src/core/domain/entities/user';
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
  IUTILS_SERVICE,
} from 'src/shared/constants';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { DeleteProductUseCase } from '../../usecases/DeleteProductUseCase';

describe('Delete Product Usecase', () => {
  let deleteProductUseCase: DeleteProductUseCase;
  let productService: IProductContract;
  let catService: ICategoryContract;
  let catRepo: CategoryRepository;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let ingService: IIngredientContract;
  let ingRepo: IngredientRepository;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let utilsService: IUtilsContract;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let user_id2: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProductUseCase,
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
        {
          provide: IUTILS_SERVICE,
          useValue: {
            verifyCepService: jest.fn(),
            validateHash: jest.fn(),
            generateHash: jest.fn(),
          },
        },
      ],
    }).compile();

    deleteProductUseCase =
      modules.get<DeleteProductUseCase>(DeleteProductUseCase);

    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    catService = modules.get<CategoryService>(ICATEGORY_CONTRACT);
    catRepo = modules.get<CategoryRepository>(CategoryRepository);
    ingService = modules.get<IngredientService>(IINGREDIENT_CONTRACT);
    ingRepo = modules.get<IngredientRepository>(IngredientRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    prismaService = modules.get<PrismaService>(PrismaService);
    utilsService = modules.get<IUtilsContract>(IUTILS_SERVICE);

    const user = await prismaService.user.create({
      data: {
        cpf: '22222222222',
        name: 'rafael ap',
        email: 'rafaap@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.OWNER,
      },
    });

    const user2 = await prismaService.user.create({
      data: {
        cpf: '33333333333',
        name: 'rafael ap',
        email: 'rafaap123@gmail.com',
        password:
          '$2a$12$e18NpJDNs7DmMRkomNrvBeo2GiYNNKnaALVPkeBFWu2wALkIVvf.u', // qweasdzxc2003
        role: UserRole.ADMIN,
      },
    });

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
        owner_id: user.id,
      },
    });

    const { id: org2_id } = await prismaService.organization.create({
      data: {
        name: 'Restaurante Fogo de chão 2',
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
        owner_id: user.id,
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

    const prod = await prismaService.product.create({
      data: {
        name: 'name',
        description: 'description',
        image_url: 'image_url',
        ingredients: [
          ing1.name,
          ing2.name,
          ing3.name,
          ing4.name,
        ] as Prisma.JsonArray,
        price: 120,
        category_id: cat_id_db,
        org_id: id,
      },
    });

    prod_id = prod.id;
    org_id = id;
    ing_ids = [ing1.id, ing2.id, ing3.id, ing4.id];
    cat_id = cat_id_db;
    org_id2 = org2_id;
    user_id = user.id;
    user_id2 = user2.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({ where: { name: 'name' } });
    await prismaService.category.deleteMany({ where: { name: 'Massas' } });
    await prismaService.ingredient.deleteMany({
      where: { icon: '🥗' },
    });
    await prismaService.organization.deleteMany({
      where: {
        name: {
          in: ['Restaurante Fogo de chão', 'Restaurante Fogo de chão 2'],
        },
      },
    });
    await prismaService.user.deleteMany({
      where: { email: { in: ['rafaap@gmail.com', 'rafaap123@gmail.com'] } },
    });
  });

  it('Should all services be defined', () => {
    expect(deleteProductUseCase).toBeDefined();
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
    expect(prod_id).toBeDefined();
    expect(ing_ids.length).toBe(4);
    expect(org_id2).toBeDefined();
    expect(user_id).toBeDefined();
    expect(user_id2).toBeDefined();
    expect(utilsService).toBeDefined();
  });

  it('Should throw an error if the product does not exist', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute('prod_id', org_id, user_id, UserRole.OWNER),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the org does not exist', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, 'org_id', user_id, UserRole.OWNER),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the product is not related with the org', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, org_id2, user_id, UserRole.OWNER),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw an error if the user is not related with the org ADMIN', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, org_id2, user_id2, UserRole.ADMIN),
    ).rejects.toThrow(ConflictException);
  });

  it('Should throw an error if the user is not related with the org OWNER', async () => {
    // Assert
    await expect(
      deleteProductUseCase.execute(prod_id, org_id2, user_id2, UserRole.OWNER),
    ).rejects.toThrow(ConflictException);
  });

  it('Should delete a product', async () => {
    // Arrange
    const product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Act
    await deleteProductUseCase.execute(
      prod_id,
      org_id,
      user_id,
      UserRole.OWNER,
    );

    const productDeleted = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Assert
    expect(product).toBeDefined();
    expect(productDeleted).toBeNull();
  });
});
