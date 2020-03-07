import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { CommandModule } from 'nestjs-command';
import { AppLogger } from './app';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GqlConfigService } from './app/_helpers/graphql';
import { AuthModule } from './app/auth/auth.module';
import { CommonModule } from './app/common/common.module';
import { DatabaseModule } from './app/database/database.module';
import { HealthCheckModule } from './app/healthcheck/healthcheck.module';
import { SecurityModule } from './app/security';
import { UserModule } from './app/user/user.module';

@Module({
  imports: [
    CommandModule,
    HealthCheckModule,
    SecurityModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    CommonModule,
    GraphQLModule.forRootAsync({
      imports: [UserModule],
      useClass: GqlConfigService,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
  private logger = new AppLogger(AppModule.name);

  constructor() {
    this.logger.log('Initialize constructor');
  }

  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(RequestContextMiddleware)
  //     .forRoutes({ path: '*', method: RequestMethod.ALL });
  // }
}
