import { faker } from '@faker-js/faker';
import { validate } from 'class-validator';
import { CreateCategoryDto } from 'src/modules/category/dto/create-category.dto';

describe('CreateCategoryDto', () => {
  const validName = faker.commerce.department();
  const validIcon = faker.internet.emoji();
  const shortName = faker.string.alpha(3);

  it('should be valid with correct fields', async () => {
    const dto = new CreateCategoryDto();
    dto.name = validName;
    dto.icon = validIcon;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require name and enforce min length 4', async () => {
    const cases = [
      { name: undefined as unknown as string },
      { name: '' },
      { name: shortName },
    ];
    for (const c of cases) {
      const dto = new CreateCategoryDto();
      dto.name = c.name;
      dto.icon = validIcon;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    }
  });

  it('should require icon as non-empty string', async () => {
    const cases = [{ icon: undefined as unknown as string }, { icon: '' }];
    for (const c of cases) {
      const dto = new CreateCategoryDto();
      dto.name = validName;
      dto.icon = c.icon;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'icon')).toBe(true);
    }
  });
});
