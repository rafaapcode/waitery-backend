import { faker } from '@faker-js/faker';
import { validate } from 'class-validator';
import { CreateIngredientDto } from 'src/modules/ingredient/dto/create-ingredient.dto';

describe('CreateIngredientDto', () => {
  const validName = faker.lorem.word();
  const validIcon = faker.internet.emoji();
  const shortName = faker.string.alpha(1);

  it('should be valid with correct fields', async () => {
    const dto = new CreateIngredientDto();
    dto.name = validName;
    dto.icon = validIcon;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require name and enforce min length 2', async () => {
    const cases = [
      { name: undefined as unknown as string },
      { name: '' },
      { name: shortName },
    ];
    for (const c of cases) {
      const dto = new CreateIngredientDto();
      dto.name = c.name;
      dto.icon = validIcon;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    }
  });

  it('should require icon as non-empty string', async () => {
    const cases = [{ icon: undefined as unknown as string }, { icon: '' }];
    for (const c of cases) {
      const dto = new CreateIngredientDto();
      dto.name = validName;
      dto.icon = c.icon;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'icon')).toBe(true);
    }
  });
});
