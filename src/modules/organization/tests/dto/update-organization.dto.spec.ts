import { validate } from 'class-validator';
import { UpdateOrganizationDTO } from 'src/modules/organization/dto/update-organization.dto';

describe('UpdateOrganizationDTO', () => {
  it('should be valid when empty (all fields optional)', async () => {
    const dto = new UpdateOrganizationDTO();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should respect validations when fields are provided', async () => {
    const valid = new UpdateOrganizationDTO();
    valid.name = 'Valid Org';
    valid.email = 'org@example.com';
    valid.description = 'valid desc';
    valid.open_hour = 8;
    valid.close_hour = 18;
    const ok = await validate(valid);
    expect(ok.length).toBe(0);
  });
});
