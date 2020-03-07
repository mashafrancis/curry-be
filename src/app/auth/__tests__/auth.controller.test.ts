import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { mockNewUser } from '../__mocks__';
import { AuthModule } from '../auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async (done) => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    done();
  });

  it('/POST user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(mockNewUser)
      .expect(204)
      .end();
  });

  // afterEach(async () => {
  //   await app.close();
  // });
});
