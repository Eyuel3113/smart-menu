import { getIO, SOCKET_ROOMS, SOCKET_EVENTS } from './index';

export function emitOrderPlaced(order: any) {
  try {
    const io = getIO();
    // Notify manager & staff dashboards
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD).emit(SOCKET_EVENTS.ORDER_PLACED, order);
    io.to(SOCKET_ROOMS.STAFF_DASHBOARD).emit(SOCKET_EVENTS.ORDER_PLACED, order);

    // Notify table room
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId)).emit(SOCKET_EVENTS.ORDER_PLACED, order);
      io.to(SOCKET_ROOMS.tableRoomAlt(order.tableId)).emit(SOCKET_EVENTS.ORDER_PLACED, order);
    }
  } catch (error) {
    console.error('Failed to emit order:placed event:', error);
  }
}

export function emitOrderAccepted(order: any) {
  try {
    const io = getIO();
    // Notify customer table tracker
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit(SOCKET_EVENTS.ORDER_ACCEPTED, order);

      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit('order:sent_to_kitchen', order);
    }

    // Push ticket to kitchen display
    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit(SOCKET_EVENTS.ORDER_ACCEPTED, order);

    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit('order:sent_to_kitchen', order);

    // Update manager & staff dashboard
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.ORDER_ACCEPTED, order);
  } catch (error) {
    console.error('Failed to emit order:accepted event:', error);
  }
}

export function emitOrderPreparing(order: any) {
  try {
    const io = getIO();
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit(SOCKET_EVENTS.ORDER_PREPARING, order);
    }
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.ORDER_PREPARING, order);

    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit(SOCKET_EVENTS.ORDER_PREPARING, order);
  } catch (error) {
    console.error('Failed to emit order:preparing event:', error);
  }
}

export function emitOrderReady(order: any) {
  try {
    const io = getIO();
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit(SOCKET_EVENTS.ORDER_READY, order);
    }
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.ORDER_READY, order);

    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit(SOCKET_EVENTS.ORDER_READY, order);
  } catch (error) {
    console.error('Failed to emit order:ready event:', error);
  }
}

export function emitOrderServed(order: any) {
  try {
    const io = getIO();
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit(SOCKET_EVENTS.ORDER_SERVED, order);
    }
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.ORDER_SERVED, order);

    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit(SOCKET_EVENTS.ORDER_SERVED, order);
  } catch (error) {
    console.error('Failed to emit order:served event:', error);
  }
}

export function emitOrderRejected(order: any) {
  try {
    const io = getIO();
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit(SOCKET_EVENTS.ORDER_REJECTED, order);
    }
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.ORDER_REJECTED, order);

    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit(SOCKET_EVENTS.ORDER_REJECTED, order);
  } catch (error) {
    console.error('Failed to emit order:rejected event:', error);
  }
}

export function emitOrderCompleted(order: any) {
  try {
    const io = getIO();
    if (order.tableId) {
      io.to(SOCKET_ROOMS.tableRoom(order.tableId))
        .to(SOCKET_ROOMS.tableRoomAlt(order.tableId))
        .to(`table_${order.tableId}`)
        .to(`table:${order.tableId}`)
        .emit(SOCKET_EVENTS.ORDER_COMPLETED, order);
    }
    io.to(SOCKET_ROOMS.MANAGER_DASHBOARD)
      .to(SOCKET_ROOMS.STAFF_DASHBOARD)
      .to('manager_dashboard')
      .to('staff:dashboard')
      .emit(SOCKET_EVENTS.ORDER_COMPLETED, order);

    io.to(SOCKET_ROOMS.KITCHEN_DISPLAY)
      .to(SOCKET_ROOMS.KITCHEN_ALT)
      .to('kitchen_display')
      .to('kitchen:display')
      .emit(SOCKET_EVENTS.ORDER_COMPLETED, order);
  } catch (error) {
    console.error('Failed to emit order:completed event:', error);
  }
}
