import { validate } from 'class-validator';
import { CreateCategoryDto } from 'src/modules/category/dto/create-category.dto';

describe('CreateCategoryDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = new CreateCategoryDto();
    dto.name = 'Food';
    dto.icon = '🍔';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require name and enforce min length 4', async () => {
    const cases = [
      { name: undefined as unknown as string },
      { name: '' },
      { name: 'abc' },
    ];
    for (const c of cases) {
      const dto = new CreateCategoryDto();
      dto.name = c.name as any;
      dto.icon = '🍔';
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
      const dto = new CreateCategoryDto();
      dto.name = 'Food';
      dto.icon = c.icon as any;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'icon')).toBe(true);
    }
  });
});


