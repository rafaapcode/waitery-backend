import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import { orderZodSchema } from './schemas/Order';
import { organizationZodSchema } from './schemas/Organization';
import { productZodSchema } from './schemas/Product';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    this.createCustomValidation();
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private createCustomValidation() {
    this.$extends({
      query: {
        order: {
          create({ args, query }) {
            args.data = orderZodSchema.parse(args.data);
            return query(args);
          },
          update({ args, query }) {
            args.data = orderZodSchema.partial().parse(args.data);
            return query(args);
          },
          updateMany({ args, query }) {
            args.data = orderZodSchema.partial().parse(args.data);
            return query(args);
          },
          upsert: ({ args, query }) => {
            args.create = orderZodSchema.parse(args.create);
            args.update = orderZodSchema.partial().parse(args.update);
            return query(args);
          },
        },
        organization: {
          create: ({ args, query }) => {
            args.data = organizationZodSchema.parse(args.data);
            return query(args);
          },
          update: ({ args, query }) => {
            args.data = organizationZodSchema.partial().parse(args.data);
            return query(args);
          },
          updateMany: ({ args, query }) => {
            args.data = organizationZodSchema.partial().parse(args.data);
            return query(args);
          },
          upsert: ({ args, query }) => {
            args.create = organizationZodSchema.parse(args.create);
            args.update = organizationZodSchema.partial().parse(args.update);
            return query(args);
          },
        },
        product: {
          create: ({ args, query }) => {
            args.data = productZodSchema.parse(args.data);
            return query(args);
          },
          update: ({ args, query }) => {
            args.data = productZodSchema.partial().parse(args.data);
            return query(args);
          },
          updateMany: ({ args, query }) => {
            args.data = productZodSchema.partial().parse(args.data);
            return query(args);
          },
          upsert: ({ args, query }) => {
            args.create = productZodSchema.parse(args.create);
            args.update = productZodSchema.partial().parse(args.update);
            return query(args);
          },
        },
      },
    });
  }
}
