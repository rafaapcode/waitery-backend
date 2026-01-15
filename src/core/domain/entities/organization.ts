import { env } from 'src/shared/config/env';
import { ulid } from 'ulid';

export class Organization {
  readonly id: string;
  readonly owner_id: string;
  readonly name: string;
  image_url: string;
  readonly email: string;
  readonly description: string;
  readonly location_code: string;
  readonly open_hour: number;
  readonly close_hour: number;
  readonly cep: string;
  readonly city: string;
  readonly neighborhood: string;
  readonly street: string;
  readonly lat: number;
  readonly long: number;

  constructor(data: Organization.Attr) {
    if (data.id) {
      this.id = data.id;
    } else {
      this.id = ulid();
    }
    this.owner_id = data.owner_id;
    this.name = data.name;
    this.image_url = data.image_url || '';
    this.email = data.email;
    this.description = data.description;
    this.location_code = data.location_code;
    this.open_hour = data.open_hour;
    this.close_hour = data.close_hour;
    this.cep = data.cep;
    this.city = data.city;
    this.neighborhood = data.neighborhood;
    this.street = data.street;
    this.lat = data.lat;
    this.long = data.long;
  }

  fromEntity() {
    return {
      id: this.id,
      name: this.name,
      image_url: this.image_url,
      email: this.email,
      description: this.description,
      location_code: this.location_code,
      open_hour: this.open_hour,
      close_hour: this.close_hour,
      cep: this.cep,
      city: this.city,
      neighborhood: this.neighborhood,
      street: this.street,
      lat: this.lat,
      long: this.long,
    };
  }

  setNewImageUrl(file_key: string) {
    this.image_url = `${env.CDN_URL}/${file_key}`;
  }
}

namespace Organization {
  export type Attr = {
    id?: string;
    owner_id: string;
    name: string;
    image_url?: string;
    email: string;
    description: string;
    location_code: string;
    open_hour: number;
    close_hour: number;
    cep: string;
    city: string;
    neighborhood: string;
    street: string;
    lat: number;
    long: number;
  };
}

export const createOganizationEntity = (
  data: Organization.Attr,
): Organization => new Organization(data);
