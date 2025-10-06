import { validate } from 'class-validator';
import { CreateOrderDto } from 'src/modules/order/dto/create-order.dto';
import { ulid } from "ulid";

const VALID_ULID = ulid();


describe('CreateOrderDto', () => {
  it('should be valid with correct fields and products', async () => {
    const dto = new CreateOrderDto();
    dto.org_id = VALID_ULID;
    dto.user_id = VALID_ULID;
    dto.table = 'A1';
    dto.products = [
      { product_id: VALID_ULID, quantity: 2, price: 19.9 },
      { product_id: VALID_ULID, quantity: 1, price: 9.5 },
    ] as any;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail on invalid ULIDs for org_id/user_id', async () => {
    const dto = new CreateOrderDto();
    dto.org_id = 'invalid';
    dto.user_id = 'invalid';
    dto.table = 'A1';
    dto.products = [] as any;
    const errors = await validate(dto);
    const props = errors.flatMap((e) => [e.property, ...(e.children ?? []).map((c) => c.property)]);
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


