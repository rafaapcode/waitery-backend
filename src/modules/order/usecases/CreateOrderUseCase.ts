import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrderContract } from 'src/core/application/contracts/order/IOrderContract';
import { IOrganizationContract } from 'src/core/application/contracts/organization/IOrganizationContract';
import { createOrderEntity, Order } from 'src/core/domain/entities/order';
import { ObservabilityService } from 'src/infra/observability/observability.service';
import { IORDER_CONTRACT, IORGANIZATION_CONTRACT } from 'src/shared/constants';
import { CreateOrderDto } from '../dto/create-order.dto';

interface ICreateOrderUseCase {
  execute(data: CreateOrderDto): Promise<Order>;
}

@Injectable()
export class CreateOrderUseCase implements ICreateOrderUseCase {
  constructor(
    @Inject(IORDER_CONTRACT)
    private readonly orderContract: IOrderContract,
    @Inject(IORGANIZATION_CONTRACT)
    private readonly orgContract: IOrganizationContract,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(data: CreateOrderDto): Promise<Order> {
    const className = CreateOrderUseCase.name;
    this.observabilityService.log(
      className,
      `Iniciando criação de pedido para organização '${data.org_id}'.`,
    );
    try {
      const orgExists = await this.orgContract.get({ id: data.org_id });
      if (!orgExists) {
        this.observabilityService.warn(
          className,
          `Organização '${data.org_id}' não encontrada ao criar pedido.`,
        );
        throw new NotFoundException('Organization not found');
      }
      if (data.products.length === 0) {
        this.observabilityService.warn(
          className,
          `Tentativa de criar pedido sem produtos para organização '${data.org_id}'.`,
        );
        throw new BadRequestException('Products are required');
      }
      const products_info = data.products.map((p) => ({
        product_id: p.product_id,
        quantity: p.quantity,
      }));
      const products = await this.orderContract.getProductsOfOrder(
        products_info,
        data.org_id,
      );
      if (products.length === 0) {
        this.observabilityService.warn(
          className,
          `Nenhum produto válido encontrado para o pedido na organização '${data.org_id}'.`,
        );
        throw new BadRequestException('No valid products found for the order');
      }
      const { quantity, total_price } = Order.totalQuantityAndPrice(
        products.map((product) => ({
          quantity: product.quantity,
          price: product.discount
            ? (product.discount_price ?? product.price)
            : product.price,
        })),
      );
      this.observabilityService.log(
        className,
        `Persistindo novo pedido para organização '${data.org_id}'.`,
      );
      const order = createOrderEntity({
        org_id: data.org_id,
        table: data.table,
        user_id: data.user_id,
        quantity: quantity,
        total_price: total_price,
        products,
      });
      const new_order = await this.orderContract.create(order);
      this.observabilityService.log(
        className,
        `Pedido criado com sucesso para organização '${data.org_id}'.`,
      );
      return new_order;
    } catch (error) {
      this.observabilityService.error(
        className,
        `Erro ao criar pedido para organização '${data?.org_id}'.`,
        '',
      );
      throw error;
    }
  }
}
