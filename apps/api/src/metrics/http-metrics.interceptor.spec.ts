import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

describe('HttpMetricsInterceptor', () => {
  it('increments counter with request method route and status on finalize', async () => {
    // Arrange
    const inc = jest.fn();
    const counter = { inc } as unknown as import('prom-client').Counter<string>;
    const interceptor = new HttpMetricsInterceptor(counter);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', route: { path: '/v1/chat' } }),
        getResponse: () => ({ statusCode: 201 }),
      }),
    } as ExecutionContext;
    const next = { handle: () => of({ ok: true }) } as CallHandler;

    // Act
    await firstValueFrom(interceptor.intercept(context, next));

    // Assert
    expect(inc).toHaveBeenCalledWith({
      method: 'POST',
      route: '/v1/chat',
      status_code: '201',
    });
  });

  it('uses UNKNOWN and unmatched when method and route are missing', async () => {
    // Arrange
    const inc = jest.fn();
    const counter = { inc } as unknown as import('prom-client').Counter<string>;
    const interceptor = new HttpMetricsInterceptor(counter);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as ExecutionContext;
    const next = { handle: () => of(null) } as CallHandler;

    // Act
    await firstValueFrom(interceptor.intercept(context, next));

    // Assert
    expect(inc).toHaveBeenCalledWith({
      method: 'UNKNOWN',
      route: 'unmatched',
      status_code: '500',
    });
  });
});
