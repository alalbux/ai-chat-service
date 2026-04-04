jest.mock('@prisma/client', () => {
  class PrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
  }
  return { PrismaClient };
});

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('onModuleInit calls $connect', async () => {
    // Arrange
    const svc = new PrismaService();

    // Act
    await svc.onModuleInit();

    // Assert
    expect(svc.$connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy calls $disconnect', async () => {
    // Arrange
    const svc = new PrismaService();

    // Act
    await svc.onModuleDestroy();

    // Assert
    expect(svc.$disconnect).toHaveBeenCalledTimes(1);
  });
});
