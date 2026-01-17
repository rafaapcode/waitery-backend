import { faker } from '@faker-js/faker';
import { validate } from 'class-validator';
import { SignInAuthDTO } from 'src/modules/auth/dto/signIn-auth.dto';

describe('SignInAuthDTO', () => {
  const validEmail = faker.internet.email();
  const validPassword = faker.internet.password({ length: 10 });
  const shortPassword = faker.internet.password({ length: 3 });
  const invalidEmail = faker.lorem.word();

  it('should be valid with correct email and password', async () => {
    const dto = new SignInAuthDTO();
    dto.email = validEmail;
    dto.password = validPassword;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when email is missing/empty/invalid', async () => {
    const cases = [
      { email: undefined as unknown as string, password: validPassword },
      { email: '', password: validPassword },
      { email: invalidEmail, password: validPassword },
    ];

    for (const c of cases) {
      const dto = new SignInAuthDTO();
      dto.email = c.email;
      dto.password = c.password;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    }
  });

  it('should fail when password is missing/too short', async () => {
    const cases = [
      { email: validEmail, password: undefined as unknown as string },
      { email: validEmail, password: '' },
      { email: validEmail, password: shortPassword },
    ];

    for (const c of cases) {
      const dto = new SignInAuthDTO();
      dto.email = c.email;
      dto.password = c.password;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    }
  });
});
