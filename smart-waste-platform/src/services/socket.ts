import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | null = null;

export function initSocket(server: HttpServer) {
  if (io) return io;
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);
  });
  return io;
}

export function emit(event: string, payload: any) {
  if (!io) return;
  io.emit(event, payload);
}

export function getIo() {
  return io;
}
