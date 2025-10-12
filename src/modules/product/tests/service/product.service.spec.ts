import { Test, TestingModule } from '@nestjs/testing';
import { IProductContract } from 'src/core/application/contracts/product/IProductContract';
import {
  Category,
  createCategoryEntity,
} from 'src/core/domain/entities/category';
import { createProductEntity, Product } from 'src/core/domain/entities/product';
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
          },
        },
      ],
    }).compile();

    productService = module.get<ProductService>(ProductService);
    prodcutRepo = module.get<ProductRepository>(ProductRepository);
  });

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
});
