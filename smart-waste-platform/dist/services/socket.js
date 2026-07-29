import { Server } from "socket.io";
let io = null;
export function initSocket(server) {
    if (io)
        return io;
    io = new Server(server, { cors: { origin: '*' } });
    io.on('connection', (socket) => {
        console.log('Socket connected', socket.id);
    });
    return io;
}
export function emit(event, payload) {
    if (!io)
        return;
    io.emit(event, payload);
}
export function getIo() {
    return io;
}
