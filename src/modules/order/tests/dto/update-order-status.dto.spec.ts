import { validate } from 'class-validator';
import { OrderStatus } from 'src/core/domain/entities/order';
import { UpdateOrderStatusDto } from 'src/modules/order/dto/update-order-status.dto';

describe('UpdateOrderStatusDto', () => {
  it('should be valid with correct order_id and enum status', async () => {
    const dto = new UpdateOrderStatusDto();
    dto.status = OrderStatus.DONE;
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail when status is not a valid enum', async () => {
    const dto = new UpdateOrderStatusDto();
    dto.status = 'NOT_A_STATUS' as unknown as OrderStatus;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });
});
