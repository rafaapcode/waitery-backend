import { validate } from 'class-validator';
import { CreateIngredientDto } from 'src/modules/ingredient/dto/create-ingredient.dto';

describe('CreateIngredientDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = new CreateIngredientDto();
    dto.name = 'Onion';
    dto.icon = '🧅';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require name and enforce min length 2', async () => {
    const cases = [
      { name: undefined as unknown as string },
      { name: '' },
      { name: 'A' },
    ];
    for (const c of cases) {
      const dto = new CreateIngredientDto();
      dto.name = c.name as any;
      dto.icon = '🧅';
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    }
  });

  it('should require icon as non-empty string', async () => {
    const cases = [
      { icon: undefined as unknown as string },
      { icon: '' },
    ];
    for (const c of cases) {
      const dto = new CreateIngredientDto();
      dto.name = 'Onion';
      dto.icon = c.icon as any;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'icon')).toBe(true);
    }
  });
});


