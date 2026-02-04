import { Prisma } from 'generated/prisma';
import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'WAITING',
  'IN_PRODUCTION',
  'DONE',
  'CANCELED',
]);

export const orderZodSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  org_id: z.string(),
  status: OrderStatusEnum.optional().default('WAITING'),
  total_price: z.number().int(),
  quantity: z.number().int(),
  table: z.string(),
  created_at: z.coerce.date(),
  deleted_at: z.coerce.date().nullable().optional(),
  products: z.any(),
}) satisfies z.Schema<Prisma.OrderUncheckedCreateInput>;
