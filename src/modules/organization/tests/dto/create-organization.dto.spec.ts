import { validate } from 'class-validator';
import { CreateOrganizationDTO } from 'src/modules/organization/dto/create-organization.dto';

describe('CreateOrganizationDTO', () => {
  it('should be valid with all correct fields', async () => {
    const dto = new CreateOrganizationDTO();
    dto.name = 'My Org';
    dto.email = 'org@example.com';
    dto.description = 'Strong org';
    dto.location_code = 'XYZ123';
    dto.open_hour = 8;
    dto.close_hour = 18;
    dto.cep = '12345678';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should enforce required strings and min lengths', async () => {
    const dto = new CreateOrganizationDTO();
    dto.name = 'abc';
    dto.email = 'not-an-email';
    dto.description = 'short';
    dto.location_code = '';
    dto.cep = '';

    // numbers missing
    const errors = await validate(dto);

    const props = new Set(errors.map((e) => e.property));
    expect(props.has('name')).toBe(true);
    expect(props.has('email')).toBe(true);
    expect(props.has('description')).toBe(true);
    expect(props.has('location_code')).toBe(true);
    expect(props.has('open_hour')).toBe(true);
    expect(props.has('close_hour')).toBe(true);
    expect(props.has('cep')).toBe(true);
  });
});
