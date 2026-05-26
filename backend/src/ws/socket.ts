import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { env } from '../config/env';

let io: IOServer | null = null;

export function initSocket(server: HttpServer): IOServer {
  const allowed = env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  io = new IOServer(server, {
    cors: {
      origin: allowed.length === 1 && allowed[0] === '*' ? true : allowed,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('assignment:subscribe', (assignmentId: string) => {
      if (typeof assignmentId === 'string' && assignmentId.length > 0) {
        socket.join(roomFor(assignmentId));
      }
    });
    socket.on('assignment:unsubscribe', (assignmentId: string) => {
      if (typeof assignmentId === 'string') {
        socket.leave(roomFor(assignmentId));
      }
    });
  });

  return io;
}

export function emitToAssignment(assignmentId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(roomFor(assignmentId)).emit(event, payload);
}

function roomFor(id: string): string {
  return `assignment:${id}`;
}
