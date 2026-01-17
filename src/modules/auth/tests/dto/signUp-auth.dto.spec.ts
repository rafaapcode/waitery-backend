import { faker } from '@faker-js/faker';
import { validate } from 'class-validator';
import { SignUpAuthDTO } from 'src/modules/auth/dto/signUp-auth.dto';

describe('SignUpAuthDTO', () => {
  const validName = faker.person.fullName();
  const validEmail = faker.internet.email();
  const validPassword = faker.internet.password({ length: 10 });
  const validCpf = faker.string.numeric(11);
  const shortName = faker.lorem.word().substring(0, 5);
  const shortPassword = faker.internet.password({ length: 5 });
  const shortCpf = faker.string.numeric(10);
  const invalidEmail = faker.lorem.word();

  it('should be valid with all correct fields', async () => {
    const dto = new SignUpAuthDTO();
    dto.name = validName;
    dto.email = validEmail;
    dto.password = validPassword;
    dto.cpf = validCpf;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate name: required and min length 8', async () => {
    const cases = [
      { name: undefined as unknown as string },
      { name: '' },
      { name: shortName },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();

      dto.name = c.name;
      dto.email = validEmail;
      dto.password = validPassword;
      dto.cpf = validCpf;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    }
  });

  it('should validate email: required and valid format', async () => {
    const cases = [
      { email: undefined as unknown as string },
      { email: '' },
      { email: invalidEmail },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();
      dto.name = validName;
      dto.email = c.email;
      dto.password = validPassword;
      dto.cpf = validCpf;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    }
  });

  it('should validate password: required and min length 8', async () => {
    const cases = [
      { password: undefined as unknown as string },
      { password: '' },
      { password: shortPassword },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();
      dto.name = validName;
      dto.email = validEmail;
      dto.password = c.password;
      dto.cpf = validCpf;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    }
  });

  it('should validate cpf: required and min length 11', async () => {
    const cases = [
      { cpf: undefined as unknown as string },
      { cpf: '' },
      { cpf: shortCpf },
    ];
    for (const c of cases) {
      const dto = new SignUpAuthDTO();
      dto.name = validName;
      dto.email = validEmail;
      dto.password = validPassword;
      dto.cpf = c.cpf;
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'cpf')).toBe(true);
    }
  });
});
