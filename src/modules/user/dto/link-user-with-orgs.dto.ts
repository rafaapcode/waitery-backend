import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class LinkUserWithOrgs {
  @IsString()
  @IsNotEmpty()
  @IsArray()
  org_ids: string[];
}
