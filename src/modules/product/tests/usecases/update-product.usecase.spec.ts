import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma';
import { IIngredientContract } from 'src/core/application/contracts/ingredient/IIngredientContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import { UserRole } from 'src/core/domain/entities/user';
import { PrismaService } from 'src/infra/database/database.service';
import { IngredientService } from 'src/modules/ingredient/ingredient.service';
import { IngredientRepository } from 'src/modules/ingredient/repo/ingredient.repository';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { OrganizationRepo } from 'src/modules/organization/repo/organization.repo';
import {
  IINGREDIENT_CONTRACT,
  IORGANIZATION_CONTRACT,
  IPRODUCT_CONTRACT,
} from 'src/shared/constants';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';
import { UpdateProductUseCase } from '../../usecases/UpdateProductUseCase';

describe('Update Product Usecase', () => {
  let updateProductUseCase: UpdateProductUseCase;
  let productService: IProductContract;
  let orgService: IOrganizationContract;
  let orgRepo: OrganizationRepo;
  let ingService: IIngredientContract;
  let ingRepo: IngredientRepository;
  let productRepo: ProductRepository;
  let prismaService: PrismaService;
  let org_id: string;
  let org_id2: string;
  let user_id: string;
  let cat_id: string;
  let prod_id: string;
  let ing_ids: string[];

  beforeAll(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductUseCase,
        ProductRepository,
        IngredientRepository,
        OrganizationRepo,
        PrismaService,
        {
          provide: IPRODUCT_CONTRACT,
          useClass: ProductService,
        },
        {
          provide: IORGANIZATION_CONTRACT,
          useClass: OrganizationService,
        },
        {
          provide: IINGREDIENT_CONTRACT,
          useClass: IngredientService,
        },
      ],
    }).compile();

    updateProductUseCase =
      modules.get<UpdateProductUseCase>(UpdateProductUseCase);
    productService = modules.get<ProductService>(IPRODUCT_CONTRACT);
    productRepo = modules.get<ProductRepository>(ProductRepository);
    orgService = modules.get<IOrganizationContract>(IORGANIZATION_CONTRACT);
    orgRepo = modules.get<OrganizationRepo>(OrganizationRepo);
    ingService = modules.get<IIngredientContract>(IINGREDIENT_CONTRACT);
    ingRepo = modules.get<IngredientRepository>(IngredientRepository);
    prismaService = modules.get<PrismaService>(PrismaService);

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

    const org2 = await prismaService.organization.create({
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

    const [ing1, ing2] = await Promise.all([
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
    ]);

    const prod = await prismaService.product.create({
      data: {
        name: 'name',
        description: 'description',
        image_url: 'image_url',
        ingredients: [ing1.name] as Prisma.JsonArray,
        price: 120,
        category_id: cat_id_db,
        org_id: id,
      },
    });

    org_id = id;
    cat_id = cat_id_db;
    user_id = user.id;
    prod_id = prod.id;
    ing_ids = [ing1.id, ing2.id];
    org_id2 = org2.id;
  });

  afterAll(async () => {
    await prismaService.product.deleteMany({
      where: { org_id },
    });
    await prismaService.ingredient.deleteMany({
      where: { icon: '🥗' },
    });
    await prismaService.category.deleteMany({
      where: { name: { in: ['Massas', 'Massas2'] } },
    });
    await prismaService.organization.deleteMany({
      where: {
        name: {
          in: ['Restaurante Fogo de chão', 'Restaurante Fogo de chão 2'],
        },
      },
    });
    await prismaService.user.deleteMany({
      where: { email: 'rafaap@gmail.com' },
    });
  });

  it('Should all services be defined', () => {
    expect(updateProductUseCase).toBeDefined();
    expect(productService).toBeDefined();
    expect(productRepo).toBeDefined();
    expect(orgService).toBeDefined();
    expect(orgRepo).toBeDefined();
    expect(ingService).toBeDefined();
    expect(ingRepo).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(org_id).toBeDefined();
    expect(org_id2).toBeDefined();
    expect(cat_id).toBeDefined();
    expect(user_id).toBeDefined();
    expect(prod_id).toBeDefined();
    expect(ing_ids).toBeDefined();
  });

  it('Should not be able to update a product if organization does not exist', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: 'name2',
      price: 130,
    };
    // Assert
    await expect(
      updateProductUseCase.execute('fake_id', prod_id, data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should not be able to update a product if product does not exist', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: 'name2',
      price: 130,
    };

    // Assert
    await expect(
      updateProductUseCase.execute(org_id, 'prod_id', data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should not be able to update a product if product is not related with the org', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: 'name2',
      price: 130,
    };

    // Assert
    await expect(
      updateProductUseCase.execute(org_id2, prod_id, data),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should be not able to update a product if the discount is true and discounted_price is not passed or 0', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: 'Novo nome do produto',
      price: 250,
    };

    // Assert
    await expect(
      updateProductUseCase.execute(org_id, prod_id, data),
    ).rejects.toThrow(ConflictException);
  });

  it('Should  be able to update a product', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: 'Novo nome do produto',
      price: 250,
    };
    const old_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Act
    await updateProductUseCase.execute(org_id, prod_id, data);

    const new_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Assert
    expect(old_product).toBeDefined();
    expect(new_product).toBeDefined();
    expect(old_product!.id).toEqual(new_product!.id);
    expect(old_product!.name).not.toEqual(new_product!.name);
    expect(old_product!.price).not.toEqual(new_product!.price);
    expect(new_product!.name).toEqual(data.name);
    expect(new_product!.price).toEqual(data.price);
    expect(new_product!.discount).toBeFalsy();
    expect(old_product!.ingredients).toEqual(new_product!.ingredients);
  });

  it('Should  be able to update a product with new ingredients', async () => {
    // Arrange
    const data: UpdateProductDto = {
      name: 'Novo nome do produto 123123',
      ingredients: ing_ids,
    };
    const old_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Act
    await updateProductUseCase.execute(org_id, prod_id, data);

    const new_product = await prismaService.product.findUnique({
      where: { id: prod_id },
    });

    // Assert
    expect(old_product).toBeDefined();
    expect(new_product).toBeDefined();
    expect(old_product!.id).toEqual(new_product!.id);
    expect(old_product!.name).not.toEqual(new_product!.name);
    expect(old_product!.ingredients).not.toEqual(new_product!.ingredients);
  });
});
