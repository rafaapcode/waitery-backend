import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RemoveUserFromOrgDTO {
  @IsString()
  @IsNotEmpty()
  @IsArray()
  org_ids: string[];
}
