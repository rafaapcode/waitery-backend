import { validate } from 'class-validator';
import { SignUpAuthDTO } from 'src/modules/auth/dto/signUp-auth.dto';

describe('SignUpAuthDTO', () => {
  it('should be valid with all correct fields', async () => {
    const dto = new SignUpAuthDTO();
    dto.name = 'John Smith';
    dto.email = 'john@example.com';
    dto.password = 'strongPass9';
    dto.cpf = '12345678901';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate name: required and min length 8', async () => {
    const cases = [
      { name: undefined as unknown as string },
      { name: '' },
      { name: 'short' },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();

      dto.name = c.name;
      dto.email = 'john@example.com';
      dto.password = 'strongPass9';
      dto.cpf = '12345678901';
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    }
  });

  it('should validate email: required and valid format', async () => {
    const cases = [
      { email: undefined as unknown as string },
      { email: '' },
      { email: 'invalid-email' },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();
      dto.name = 'John Smith';
      dto.email = c.email;
      dto.password = 'strongPass9';
      dto.cpf = '12345678901';
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    }
  });

  it('should validate password: required and min length 8', async () => {
    const cases = [
      { password: undefined as unknown as string },
      { password: '' },
      { password: 'short' },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();
      dto.name = 'John Smith';
      dto.email = 'john@example.com';
      dto.password = c.password;
      dto.cpf = '12345678901';
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    }
  });

  it('should validate cpf: required and min length 11', async () => {
    const cases = [
      { cpf: undefined as unknown as string },
      { cpf: '' },
      { cpf: '1234567890' },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();
      dto.name = 'John Smith';
      dto.email = 'john@example.com';
      dto.password = 'strongPass9';
      dto.cpf = c.cpf;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'cpf')).toBe(true);
    }
  });
});
