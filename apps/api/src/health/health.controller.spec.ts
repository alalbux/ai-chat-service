import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('live returns ok status', () => {
    // Arrange
    const prisma = {} as PrismaService;
    const controller = new HealthController(prisma);

    // Act
    const body = controller.live();

    // Assert
    expect(body).toEqual({ status: 'ok' });
  });

  it('ready returns ok when database query succeeds', async () => {
    // Arrange
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    // Act
    const body = await controller.ready();

    // Assert
    expect(body).toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('ready throws ServiceUnavailableException when database query fails', async () => {
    // Arrange
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    // Act
    const promise = controller.ready();

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
