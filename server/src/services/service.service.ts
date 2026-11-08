import { ServiceRequestType, ServiceRequestStatus, TableStatus } from '@prisma/client';
import prisma from '../config/db';
import { AppError } from '../utils/response';
import { emitServiceRequested, emitServiceStatusUpdated, emitTableStatusUpdated } from '../sockets/serviceEvents';

export class ServiceService {
  static async createRequest(tableId: string, type: ServiceRequestType) {
    const parsedNumber = tableId.startsWith('tbl-uuid-')
      ? parseInt(tableId.replace('tbl-uuid-', ''), 10)
      : !isNaN(Number(tableId))
      ? Number(tableId)
      : undefined;

    const table = await prisma.table.findFirst({
      where: {
        OR: [
          { id: tableId },
          ...(parsedNumber ? [{ tableNumber: parsedNumber }] : []),
        ],
      },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    const resolvedTableId = table.id;

    // Check if there is already an active pending request of the same type
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        tableId: resolvedTableId,
        type,
        status: { in: [ServiceRequestStatus.PENDING, ServiceRequestStatus.ACKNOWLEDGED] },
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, status: true },
        },
      },
    });

    if (existing) {
      return existing;
    }

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.serviceRequest.create({
        data: {
          tableId: resolvedTableId,
          type,
          status: ServiceRequestStatus.PENDING,
        },
        include: {
          table: {
            select: { id: true, tableNumber: true, status: true },
          },
        },
      });

      if (type === ServiceRequestType.REQUEST_BILL && table.status !== TableStatus.BILL_REQUESTED) {
        const updatedTable = await tx.table.update({
          where: { id: resolvedTableId },
          data: { status: TableStatus.BILL_REQUESTED },
        });
        emitTableStatusUpdated(updatedTable);
      }

      return created;
    });

    emitServiceRequested(request);
    return request;
  }

  static async getRequests(restaurantId: string, status?: ServiceRequestStatus) {
    return prisma.serviceRequest.findMany({
      where: {
        table: {
          restaurantId,
        },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: {
          select: { id: true, tableNumber: true, status: true },
        },
      },
    });
  }

  static async updateStatus(requestId: string, status: ServiceRequestStatus) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AppError('Service request not found', 404);
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === ServiceRequestStatus.RESOLVED ? { resolvedAt: new Date() } : {}),
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, status: true },
        },
      },
    });

    emitServiceStatusUpdated(updated);
    return updated;
  }
}
