import { validate } from 'class-validator';
import { UpdateOrganizationDTO } from 'src/modules/organization/dto/update-organization.dto';

describe('UpdateOrganizationDTO', () => {
  it('should be valid when empty (all fields optional)', async () => {
    const dto = new UpdateOrganizationDTO();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should respect validations when fields are provided', async () => {
    const invalid = new UpdateOrganizationDTO();
    invalid.name = 'abc' as any; // too short (<4)
    invalid.email = 'invalid' as any; // not email
    invalid.description = 'short' as any; // too short (<6)
    invalid.open_hour = '8' as any; // not number
    invalid.close_hour = '18' as any; // not number
    invalid.lat = 'nan' as any; // not number
    invalid.long = 'nan' as any; // not number
    const invalidErrors = await validate(invalid);
    const props = new Set(invalidErrors.map((e) => e.property));
    expect(props.has('name')).toBe(true);
    expect(props.has('email')).toBe(true);
    expect(props.has('description')).toBe(true);
    expect(props.has('open_hour')).toBe(true);
    expect(props.has('close_hour')).toBe(true);
    expect(props.has('lat')).toBe(true);
    expect(props.has('long')).toBe(true);

    const valid = new UpdateOrganizationDTO();
    valid.name = 'Valid Org';
    valid.email = 'org@example.com';
    valid.description = 'valid desc';
    valid.open_hour = 8;
    valid.close_hour = 18;
    valid.lat = -23.5;
    valid.long = -46.6;
    const ok = await validate(valid);
    expect(ok.length).toBe(0);
  });
});
