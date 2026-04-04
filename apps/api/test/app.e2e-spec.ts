import { VersioningType, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

const runE2e = Boolean(process.env.DATABASE_URL);

(runE2e ? describe : describe.skip)('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.LLM_MOCK = process.env.LLM_MOCK ?? '1';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health live', async () => {
    const res = await request(app.getHttpServer()).get('/health/live').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /v1/chat persists mock reply', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/chat')
      .send({ userId: 'e2e-user', prompt: 'hello e2e' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.provider).toBe('mock');
    expect(res.body.reply).toContain('[mock]');

    const get = await request(app.getHttpServer()).get(`/v1/chats/${res.body.id}`).expect(200);
    expect(get.body.prompt).toBe('hello e2e');

    await prisma.chat.delete({ where: { id: res.body.id } });
  });
});
