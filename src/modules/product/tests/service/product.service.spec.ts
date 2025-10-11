import { Test, TestingModule } from '@nestjs/testing';
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
          useValue: {},
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
});
