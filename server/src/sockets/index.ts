import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export const SOCKET_ROOMS = {
  MANAGER_DASHBOARD: 'manager_dashboard',
  STAFF_DASHBOARD: 'staff:dashboard',
  KITCHEN_DISPLAY: 'kitchen_display',
  KITCHEN_ALT: 'kitchen:display',
  tableRoom: (tableId: string) => `table_${tableId}`,
  tableRoomAlt: (tableId: string) => `table:${tableId}`,
};

export const SOCKET_EVENTS = {
  // Client emission triggers to join rooms
  JOIN_TABLE: 'join_table_room',
  LEAVE_TABLE: 'leave_table_room',
  JOIN_MANAGER: 'join_manager_room',
  JOIN_KITCHEN: 'join_kitchen_room',

  // Order Lifecycle
  ORDER_PLACED: 'order:placed',
  ORDER_ACCEPTED: 'order:accepted',
  ORDER_PREPARING: 'order:preparing',
  ORDER_READY: 'order:ready',
  ORDER_SERVED: 'order:served',
  ORDER_REJECTED: 'order:rejected',
  ORDER_COMPLETED: 'order:completed',

  // Table & Service Requests
  TABLE_STATUS_UPDATED: 'table:status_updated',
  TABLE_CREATED: 'table:created',
  TABLE_UPDATED: 'table:updated',
  TABLE_DELETED: 'table:deleted',
  TABLE_PAID_PENDING: 'table:paid_pending',
  TABLE_SESSION_CONCLUDED: 'table:session_concluded',
  SERVICE_REQUESTED: 'service:requested',
  SERVICE_STATUS_UPDATED: 'service:status_updated',
};

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket: Socket) => {
    // 1. Join Table Room
    socket.on(SOCKET_EVENTS.JOIN_TABLE, (tableId: string) => {
      if (tableId) {
        socket.join(SOCKET_ROOMS.tableRoom(tableId));
        socket.join(SOCKET_ROOMS.tableRoomAlt(tableId));
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_TABLE, (tableId: string) => {
      if (tableId) {
        socket.leave(SOCKET_ROOMS.tableRoom(tableId));
        socket.leave(SOCKET_ROOMS.tableRoomAlt(tableId));
      }
    });

    // 2. Join Manager Room
    socket.on(SOCKET_EVENTS.JOIN_MANAGER, () => {
      socket.join(SOCKET_ROOMS.MANAGER_DASHBOARD);
      socket.join(SOCKET_ROOMS.STAFF_DASHBOARD);
    });

    // 3. Join Kitchen Room
    socket.on(SOCKET_EVENTS.JOIN_KITCHEN, () => {
      socket.join(SOCKET_ROOMS.KITCHEN_DISPLAY);
      socket.join(SOCKET_ROOMS.KITCHEN_ALT);
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocketIO first.');
  }
  return io;
}

export * from './orderEvents';
export * from './serviceEvents';
