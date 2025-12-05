import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';

@WebSocketGateway({ transports: ['websocket'] })
export class WsGateway implements OnModuleInit, IOrderWSContract {
  @WebSocketServer() private readonly server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('User connected', socket.id);
    });
  }

  emitCreateOrder(data: IOrderWSContract.CreateParams): void {
    this.server.emit(data.event, data.data);
  }
}

export default WsGateway;
