import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IOrderWSContract } from 'src/core/application/contracts/order/IOrderWSContract';

@WebSocketGateway({ transports: ['websocket'] })
export class WsGateway implements OnModuleInit, IOrderWSContract {
  @WebSocketServer() private readonly server: Server;

  onModuleInit() {
    console.log('WebSocket server initialized');
    this.server.on('connection', (socket) => {
      console.log('User connected', socket.id);

      const orgId = socket.handshake.query.orgId || socket.handshake.headers['x-org-id'];
      if (orgId) {
        const roomName = `order-org-${orgId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      }

      socket.on('join-org', (orgId: string) => {
        if (orgId) {
          const roomName = `order-org-${orgId}`;
          socket.join(roomName);
          console.log(`Socket ${socket.id} manually joined room: ${roomName}`);
        }
      });
    });
  }

  emitCreateOrder(data: IOrderWSContract.CreateParams): void {
    this.server.to(data.event).emit(data.event, data.data);
  }
}

export default WsGateway;
