import { validate } from 'class-validator';
import { CreateOrganizationDTO } from 'src/modules/organization/dto/create-organization.dto';

describe('CreateOrganizationDTO', () => {
  it('should be valid with all correct fields', async () => {
    const dto = new CreateOrganizationDTO();
    dto.name = 'My Org';
    dto.image_url = 'https://image.test/logo.png';
    dto.email = 'org@example.com';
    dto.description = 'Strong org';
    dto.location_code = 'XYZ123';
    dto.open_hour = 8;
    dto.close_hour = 18;
    dto.cep = '12345678';
    dto.city = 'City';
    dto.neighborhood = 'Center';
    dto.street = 'Main St';
    dto.lat = -23.5;
    dto.long = -46.6;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should enforce required strings and min lengths', async () => {
    const dto = new CreateOrganizationDTO();
    dto.name = 'abc'; // too short (<4)
    dto.image_url = '' as any; // empty
    dto.email = 'not-an-email' as any; // invalid email
    dto.description = 'short'; // too short (<6)
    dto.location_code = '' as any; // empty
    dto.cep = '' as any; // empty
    dto.city = '' as any; // empty
    dto.neighborhood = '' as any; // empty
    dto.street = '' as any; // empty
    // numbers missing
    const errors = await validate(dto);

    const props = new Set(errors.map((e) => e.property));
    expect(props.has('name')).toBe(true);
    expect(props.has('image_url')).toBe(true);
    expect(props.has('email')).toBe(true);
    expect(props.has('description')).toBe(true);
    expect(props.has('location_code')).toBe(true);
    expect(props.has('open_hour')).toBe(true);
    expect(props.has('close_hour')).toBe(true);
    expect(props.has('cep')).toBe(true);
    expect(props.has('city')).toBe(true);
    expect(props.has('neighborhood')).toBe(true);
    expect(props.has('street')).toBe(true);
    expect(props.has('lat')).toBe(true);
    expect(props.has('long')).toBe(true);
  });

  it('should validate numeric fields when present', async () => {
    const dto = new CreateOrganizationDTO();
    dto.name = 'Valid Name';
    dto.image_url = 'url';
    dto.email = 'org@example.com';
    dto.description = 'valid description';
    dto.location_code = 'code';
    dto.open_hour = '8' as any; // not number
    dto.close_hour = '18' as any; // not number
    dto.cep = '123';
    dto.city = 'c';
    dto.neighborhood = 'n';
    dto.street = 's';
    dto.lat = 'not-a-number' as any;
    dto.long = 'not-a-number' as any;
    const errors = await validate(dto);
    const props = new Set(errors.map((e) => e.property));
    expect(props.has('open_hour')).toBe(true);
    expect(props.has('close_hour')).toBe(true);
    expect(props.has('lat')).toBe(true);
    expect(props.has('long')).toBe(true);
  });
});
