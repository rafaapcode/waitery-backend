import { Test, TestingModule } from '@nestjs/testing';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import {
  Category,
  createCategoryEntity,
} from 'src/core/domain/entities/category';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
import { UserRole } from 'src/core/domain/entities/user';
import { ProductService } from '../../product.service';
import { ProductRepository } from '../../repo/product.repository';

describe('Products Service', () => {
  let productService: ProductService;
  let prodcutRepo: ProductRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            verifyOrgById: jest.fn(),
            getByCategory: jest.fn(),
            getByName: jest.fn(),
          },
        },
      ],
    }).compile();

    productService = module.get<ProductService>(ProductService);
    prodcutRepo = module.get<ProductRepository>(ProductRepository);
  });

  beforeEach(() => jest.clearAllMocks());

  it('Should define all services', () => {
    expect(productService).toBeDefined();
    expect(prodcutRepo).toBeDefined();
  });

  it('Should create a new product', async () => {
    // Arrange
    const data: IProductContract.CreateParams = createProductEntity({
      description: 'description',
      discount: false,
      image_url: 'http://locaho',
      ingredients: [],
      name: 'Produto 1',
      org_id: 'org_id',
      price: 12,
      discounted_price: 0,
      category: createCategoryEntity({
        icon: '🥗',
        name: 'Teste',
        org_id: '123123',
        id: 'cat_id123123',
      }),
    });
    jest.spyOn(prodcutRepo, 'create').mockResolvedValue({
      description: 'description',
      discount: false,
      image_url: 'http://locaho',
      ingredients: [],
      name: 'Produto 1',
      org_id: 'org_id',
      price: 12,
      discounted_price: 0,
      category_id: 'cateory_id1231',
      id: '12312313',
      category: {
        icon: '💪',
        name: 'nam,e',
        org_id: 'org_id',
        id: '123123',
      },
    });

    // Act
    const product = await productService.create(data);

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(product.category).toBeInstanceOf(Category);
    expect(prodcutRepo.create).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.create).toHaveBeenCalledWith(data);
  });

  it('Should update a product', async () => {
    // Arrange
    const data: IProductContract.UpdateParams = {
      id: 'id_product',
      data: {
        description: 'description',
        image_url: 'http://locaho',
      },
    };
    jest.spyOn(prodcutRepo, 'update').mockResolvedValue();

    // Act
    await productService.update(data);

    // Assert
    expect(prodcutRepo.update).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.update).toHaveBeenCalledWith(data);
  });

  it('Should delete a product', async () => {
    // Arrange
    const id = 'id_product';
    jest.spyOn(prodcutRepo, 'delete').mockResolvedValue();

    // Act
    await productService.delete(id);

    // Assert
    expect(prodcutRepo.delete).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.delete).toHaveBeenCalledWith(id);
  });

  it('Should get a product', async () => {
    // Arrange
    const id = 'id_product';
    jest.spyOn(prodcutRepo, 'get').mockResolvedValue({
      description: 'description',
      discount: false,
      image_url: 'http://locaho',
      ingredients: [],
      name: 'Produto 1',
      org_id: 'org_id',
      price: 12,
      discounted_price: 0,
      category_id: 'cateory_id1231',
      id: '12312313',
      category: {
        icon: '💪',
        name: 'nam,e',
        org_id: 'org_id',
        id: '123123',
      },
    });

    // Act
    const product = await productService.get(id);

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(prodcutRepo.get).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.get).toHaveBeenCalledWith(id);
  });

  it('Should  return null if a product does not exist', async () => {
    // Arrange
    const id = 'id_product';
    jest.spyOn(prodcutRepo, 'get').mockResolvedValue(null);

    // Act
    const product = await productService.get(id);

    // Assert
    expect(product).toBeNull();
    expect(prodcutRepo.get).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.get).toHaveBeenCalledWith(id);
  });

  it('Should return all products of a org of page 0', async () => {
    // Arrange
    const org_id = 'org_id';
    jest.spyOn(prodcutRepo, 'getAll').mockResolvedValue(
      Array.from({ length: 16 }).map((_, idx) => ({
        description: 'description',
        discount: false,
        image_url: 'http://locaho',
        ingredients: [],
        name: 'Produto 1',
        org_id: 'org_id',
        price: 12,
        discounted_price: 0,
        category_id: `cateory_id_${idx}`,
        id: `${idx}`,
        category: {
          icon: '💪',
          name: 'nam,e',
          org_id: 'org_id',
          id: '123123',
        },
      })),
    );

    // Act
    const product = await productService.getAll({
      org_id,
    });

    // Assert
    expect(product.has_next).toBeTruthy();
    expect(product.products.length).toBe(15);
    expect(product.products[0]).toBeInstanceOf(Product);
    expect(prodcutRepo.getAll).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.getAll).toHaveBeenCalledWith(org_id, 16, 0);
  });

  it('Should return zero products on page 1', async () => {
    // Arrange
    const org_id = 'org_id';
    jest.spyOn(prodcutRepo, 'getAll').mockResolvedValue([]);

    // Act
    const product = await productService.getAll({
      org_id,
      page: 1,
    });

    // Assert
    expect(product.has_next).toBeFalsy();
    expect(product.products.length).toBe(0);
    expect(prodcutRepo.getAll).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.getAll).toHaveBeenCalledWith(org_id, 16, 15);
  });

  it('Should return true if the user  is related with the ORG', async () => {
    // Arrange
    const data = {
      org_id: 'org_id',
      user_id: 'user_id',
      user_role: UserRole.OWNER,
    };
    jest.spyOn(prodcutRepo, 'verifyOrgById').mockResolvedValue(true);

    // Act
    const user_has_org = await productService.verifyOrgById(data);

    // Assert
    expect(user_has_org).toBeTruthy();
  });

  it('Should return false if the user is not related with the ORG', async () => {
    // Arrange
    const data = {
      org_id: 'org_id',
      user_id: 'user_id',
      user_role: UserRole.ADMIN,
    };
    jest.spyOn(prodcutRepo, 'verifyOrgById').mockResolvedValue(false);

    // Act
    const user_has_org = await productService.verifyOrgById(data);

    // Assert
    expect(user_has_org).toBeFalsy();
  });

  it('Should return all products of a category on the page 0', async () => {
    // Arrange
    const data: IProductContract.GetProductsByCategoryParams = {
      category_id: 'cat_id',
      org_id: 'org_id',
    };
    jest.spyOn(prodcutRepo, 'getByCategory').mockResolvedValue(
      Array.from({ length: 16 }).map((_, idx) => ({
        description: 'description',
        discount: false,
        image_url: 'http://locaho',
        ingredients: [],
        name: 'Produto 1',
        org_id: 'org_id',
        price: 12,
        discounted_price: 0,
        category_id: `cateory_id_${idx}`,
        id: `${idx}`,
        category: {
          icon: '💪',
          name: 'nam,e',
          org_id: 'org_id',
          id: '123123',
        },
      })),
    );

    // Act
    const products = await productService.getProductsByCategory(data);

    // Assert
    expect(products.has_next).toBeTruthy();
    expect(products.products.length).toBe(15);
    expect(products.products[0]).toBeInstanceOf(Product);
    expect(prodcutRepo.getByCategory).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.getByCategory).toHaveBeenCalledWith(
      data.org_id,
      data.category_id,
      16,
      0,
    );
  });

  it('Should return 0 products of a category on the page 1', async () => {
    // Arrange
    const data: IProductContract.GetProductsByCategoryParams = {
      category_id: 'cat_id',
      org_id: 'org_id',
      page: 1,
    };
    jest.spyOn(prodcutRepo, 'getByCategory').mockResolvedValue([]);

    // Act
    const products = await productService.getProductsByCategory(data);

    // Assert
    expect(products.has_next).toBeFalsy();
    expect(products.products.length).toBe(0);
    expect(prodcutRepo.getByCategory).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.getByCategory).toHaveBeenCalledWith(
      data.org_id,
      data.category_id,
      16,
      15,
    );
  });

  it('Should return a product filtered by name', async () => {
    // Arrange
    const data: IProductContract.GetProductsByNameParams = {
      org_id: 'org_id',
      name: 'nome teste 1',
    };
    jest.spyOn(prodcutRepo, 'getByName').mockResolvedValue({
      description: 'description',
      discount: false,
      image_url: 'http://locaho',
      ingredients: [],
      name: 'Produto 1',
      org_id: 'org_id',
      price: 12,
      discounted_price: 0,
      category_id: 'cateory_id1231',
      id: '12312313',
      category: {
        icon: '💪',
        name: 'nam,e',
        org_id: 'org_id',
        id: '123123',
      },
    });

    // Act
    const product = await productService.getProductByName(data);

    // Assert
    expect(product).toBeInstanceOf(Product);
    expect(prodcutRepo.getByName).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.getByName).toHaveBeenCalledWith(data.name, data.org_id);
  });

  it('Should return null if a product does not exists with a specific name', async () => {
    // Arrange
    const data: IProductContract.GetProductsByNameParams = {
      org_id: 'org_id',
      name: 'nome teste 1',
    };
    jest.spyOn(prodcutRepo, 'getByName').mockResolvedValue(null);

    // Act
    const product = await productService.getProductByName(data);

    // Assert
    expect(product).toBeNull();
    expect(prodcutRepo.getByName).toHaveBeenCalledTimes(1);
    expect(prodcutRepo.getByName).toHaveBeenCalledWith(data.name, data.org_id);
  });
});
