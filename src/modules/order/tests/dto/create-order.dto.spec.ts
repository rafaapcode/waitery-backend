/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { faker } from '@faker-js/faker';
import { validate } from 'class-validator';
import { CreateOrderDto } from 'src/modules/order/dto/create-order.dto';
import { ulid } from 'ulid';

const VALID_ULID = ulid();
const tableName = `Mesa ${faker.number.int({ min: 1, max: 50 })}`;
const invalidId = faker.lorem.word();
const product1Price = faker.number.float({
  min: 5,
  max: 100,
  fractionDigits: 2,
});
const product2Price = faker.number.float({
  min: 5,
  max: 100,
  fractionDigits: 2,
});
const product1Quantity = faker.number.int({ min: 1, max: 5 });
const product2Quantity = faker.number.int({ min: 1, max: 5 });

describe('CreateOrderDto', () => {
  it('should be valid with correct fields and products', async () => {
    const dto = new CreateOrderDto();
    dto.org_id = VALID_ULID;
    dto.user_id = VALID_ULID;
    dto.table = tableName;
    dto.products = [
      {
        product_id: VALID_ULID,
        quantity: product1Quantity,
        price: product1Price,
      },
      {
        product_id: VALID_ULID,
        quantity: product2Quantity,
        price: product2Price,
      },
    ] as any;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail on invalid ULIDs for org_id/user_id', async () => {
    const dto = new CreateOrderDto();
    dto.org_id = invalidId;
    dto.user_id = invalidId;
    dto.table = tableName;
    dto.products = [] as any;
    const errors = await validate(dto);
    const props = errors.flatMap((e) => [
      e.property,
      ...(e.children ?? []).map((c) => c.property),
    ]);
    expect(props).toContain('org_id');
    expect(props).toContain('user_id');
  });

  it('should require non-empty table', async () => {
    const cases = ['', undefined as unknown as string];
    for (const t of cases) {
      const dto = new CreateOrderDto();
      dto.org_id = VALID_ULID;
      dto.user_id = VALID_ULID;
      dto.table = t as any;
      dto.products = [] as any;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'table')).toBe(true);
    }
  });
});
