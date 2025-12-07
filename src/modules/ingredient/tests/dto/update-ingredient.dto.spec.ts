import { validate } from 'class-validator';
import { UpdateIngredientDto } from 'src/modules/ingredient/dto/update-ingredient.dto';

describe('UpdateIngredientDto', () => {
  it('should be valid when empty (all fields optional)', async () => {
    const dto = new UpdateIngredientDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate name when provided (min length 2)', async () => {
    const valid = new UpdateIngredientDto();
    valid.name = 'Onion';
    const ok = await validate(valid);
    expect(ok.length).toBe(0);

    const invalid = new UpdateIngredientDto();
    invalid.name = 'A';
    const bad = await validate(invalid);
    expect(bad.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be valid when only icon is provided', async () => {
    const dto = new UpdateIngredientDto();
    dto.icon = '🧅';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
