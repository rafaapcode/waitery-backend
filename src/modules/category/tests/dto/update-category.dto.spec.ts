import { faker } from '@faker-js/faker';
import { validate } from 'class-validator';
import { UpdateCategoryDto } from 'src/modules/category/dto/update-category.dto';

describe('UpdateCategoryDto', () => {
  const validName = faker.commerce.department();
  const shortName = faker.string.alpha(3);
  const validIcon = faker.internet.emoji();

  it('should be valid when empty (all fields optional)', async () => {
    const dto = new UpdateCategoryDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid when only name is provided and respects min length', async () => {
    const valid = new UpdateCategoryDto();
    valid.name = validName;
    const validErrors = await validate(valid);
    expect(validErrors.length).toBe(0);

    const invalid = new UpdateCategoryDto();
    invalid.name = shortName;
    const invalidErrors = await validate(invalid);
    expect(invalidErrors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be valid when only icon is provided', async () => {
    const dto = new UpdateCategoryDto();
    dto.icon = validIcon;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
