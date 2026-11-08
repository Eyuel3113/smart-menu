import { getIO, SOCKET_ROOMS, SOCKET_EVENTS } from './index';

export function emitServiceRequested(request: any) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD).emit(SOCKET_EVENTS.SERVICE_REQUESTED, request);
    io.to(SOCKET_ROOMS.STAFF_DASHBOARD).emit(SOCKET_EVENTS.SERVICE_REQUESTED, request);

    if (request.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(request.tableId)).emit(SOCKET_EVENTS.SERVICE_REQUESTED, request);
      io.to(SOCKET_ROOMS.tableRoomAlt(request.tableId)).emit(SOCKET_EVENTS.SERVICE_REQUESTED, request);
    }
  } catch (error) {
    console.error('Failed to emit service:requested event:', error);
  }
}

export function emitServiceStatusUpdated(request: any) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD).emit(SOCKET_EVENTS.SERVICE_STATUS_UPDATED, request);
    io.to(SOCKET_ROOMS.STAFF_DASHBOARD).emit(SOCKET_EVENTS.SERVICE_STATUS_UPDATED, request);

    if (request.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(request.tableId)).emit(SOCKET_EVENTS.SERVICE_STATUS_UPDATED, request);
      io.to(SOCKET_ROOMS.tableRoomAlt(request.tableId)).emit(SOCKET_EVENTS.SERVICE_STATUS_UPDATED, request);
    }
  } catch (error) {
    console.error('Failed to emit service:status_updated event:', error);
  }
}

export function emitTableStatusUpdated(table: any) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.TABLE_STATUS_UPDATED, table);

    if (table.id) {
      io.to(SOCKET_ROOMS.tableRoom(table.id))
        .to(SOCKET_ROOMS.tableRoomAlt(table.id))
        .to(`table_${table.id}`)
        .to(`table:${table.id}`)
        .emit(SOCKET_EVENTS.TABLE_STATUS_UPDATED, table);
    }
  } catch (error) {
    console.error('Failed to emit table:status_updated event:', error);
  }
}

export function emitTableCreated(table: any) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.TABLE_CREATED, table);
  } catch (error) {
    console.error('Failed to emit table:created event:', error);
  }
}

export function emitTableUpdated(table: any) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.TABLE_UPDATED, table);
    emitTableStatusUpdated(table);
  } catch (error) {
    console.error('Failed to emit table:updated event:', error);
  }
}

export function emitTableDeleted(tableId: string, tableNumber?: number) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.TABLE_DELETED, { id: tableId, tableNumber });
  } catch (error) {
    console.error('Failed to emit table:deleted event:', error);
  }
}

export function emitTablePaidPending(table: any, transaction: any) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.TABLE_PAID_PENDING, { table, transaction });

    emitTableStatusUpdated(table);
  } catch (error) {
    console.error('Failed to emit table:paid_pending event:', error);
  }
}

export function emitTableSessionConcluded(tableId: string) {
  try {
    const io = getIO();
    io.to(SOCKET_ROOMS.tableRoom(tableId))
      .to(SOCKET_ROOMS.tableRoomAlt(tableId))
      .to(`table_${tableId}`)
      .to(`table:${tableId}`)
      .emit(SOCKET_EVENTS.TABLE_SESSION_CONCLUDED, { tableId });
  } catch (error) {
    console.error('Failed to emit table:session_concluded event:', error);
  }
}
