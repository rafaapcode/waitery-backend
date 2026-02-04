import { Prisma } from 'generated/prisma';
import { z } from 'zod';

export const organizationZodSchema = z.object({
  id: z.string().optional(),
  owner_id: z.string(),
  name: z.string(),
  image_url: z.string(),
  email: z.email(),
  description: z.string(),
  location_code: z.string(),
  open_hour: z.number().int(),
  close_hour: z.number().int(),
  cep: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  street: z.string(),
  lat: z.number(),
  long: z.number(),
}) satisfies z.Schema<Prisma.OrganizationUncheckedCreateInput>;
