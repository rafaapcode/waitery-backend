import { validate } from 'class-validator';
import { OrderStatus } from 'src/core/domain/entities/order';
import { UpdateOrderStatusDto } from 'src/modules/order/dto/update-order-status.dto';
import { ulid } from "ulid";

// A simple valid ULID for tests (26 chars Crockford base32)
const VALID_ULID = ulid();

describe('UpdateOrderStatusDto', () => {
  it('should be valid with correct order_id and enum status', async () => {
    const dto = new UpdateOrderStatusDto();
    dto.order_id = VALID_ULID;
    dto.status = OrderStatus.DONE;
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail with invalid ULID', async () => {
    const dto = new UpdateOrderStatusDto();
    dto.order_id = 'invalid';
    dto.status = OrderStatus.WAITING;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'order_id')).toBe(true);
  });

  it('should fail when status is not a valid enum', async () => {
    const dto = new UpdateOrderStatusDto();
    dto.order_id = VALID_ULID;
    dto.status = 'NOT_A_STATUS' as unknown as OrderStatus;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});


