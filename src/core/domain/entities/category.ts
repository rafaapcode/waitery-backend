export class Category {
  readonly id?: string;
  readonly org_id: string;
  readonly name: string;
  readonly icon: string;

  constructor(data: Category.Attr) {
    if (data.id) this.id = data.id;
    this.org_id = data.org_id;
    this.name = data.name;
    this.icon = data.icon;
  }
}

namespace Category {
  export type Attr = {
    id?: string;
    org_id: string;
    name: string;
    icon: string;
  };
}

export const createCategoryEntity = (data: Category.Attr): Category =>
  new Category(data);
