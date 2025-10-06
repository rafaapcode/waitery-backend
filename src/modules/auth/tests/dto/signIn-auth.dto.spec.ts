import { validate } from 'class-validator';
import { SignInAuthDTO } from 'src/modules/auth/dto/signIn-auth.dto';

describe('SignInAuthDTO', () => {
  it('should be valid with correct email and password', async () => {
    const dto = new SignInAuthDTO();
    dto.email = 'user@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when email is missing/empty/invalid', async () => {
    const cases = [
      { email: undefined as unknown as string, password: 'password123' },
      { email: '', password: 'password123' },
      { email: 'not-an-email', password: 'password123' },
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
      { email: 'user@example.com', password: undefined as unknown as string },
      { email: 'user@example.com', password: '' },
      { email: 'user@example.com', password: 'short' },
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


