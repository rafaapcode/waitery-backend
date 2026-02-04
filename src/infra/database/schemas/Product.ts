import { Prisma } from 'generated/prisma';
import { z } from 'zod';

export const productZodSchema = z.object({
  id: z.string().optional(),
  org_id: z.string(),
  name: z.string(),
  image_url: z.string(),
  description: z.string(),
  price: z.number(),
  category_id: z.string(),
  discounted_price: z.number().default(0),
  discount: z.boolean().default(false),
  ingredients: z.any(),
}) satisfies z.Schema<Prisma.ProductUncheckedCreateInput>;
