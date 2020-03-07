import { Injectable } from '@nestjs/common';
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import { has } from 'lodash';
import auth_hdr from 'passport-jwt/lib/auth_header';
import { join } from 'path';
import { config } from '../../../config';
import { AppLogger } from '../../app.logger';
import { TokenDto } from '../../auth/dto/token.dto';
import { verifyToken } from '../../auth/jwt';
import { OnlineService } from '../../user/online.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  private logger = new AppLogger(GqlConfigService.name);

  constructor(
    private readonly userService: UserService,
    private readonly onlineService: OnlineService
  ) {}

  createGqlOptions(): GqlModuleOptions {
    return {
      typePaths: [join(process.cwd(), '**/*.graphql')],
      introspection: true,
      playground: true,
      installSubscriptionHandlers: true,
      tracing: !config.isProduction,
      debug: !config.isProduction,
      definitions: {
        path: join(process.cwd(), 'src/app/graphql.schema.ts'),
        outputAs: 'class',
      },
      subscriptions: {
        onConnect: (connectionParams, _websocket, context) => {
          return new Promise(async (resolve, reject) => {
            try {
              // @ts-ignore
              const authToken = connectionParams.Authorization;
              const token = await this.validateToken(authToken);
              const user = await this.userService.findOneById(token.id);
              await this.onlineService.addUser(user);
              resolve({ req: { ...context.request, user } });
            } catch (e) {
              this.logger.error(e.message, e.stack);
              reject({ message: 'Unauthorized' });
            }
          });
        },
        onDisconnect: (_websocket, context: any) => {
          return new Promise(async (resolve) => {
            const initialContext = await context.initPromise;
            if (has(initialContext, 'req.user')) {
              await this.onlineService.removeUser(initialContext.req.user);
            }
            resolve();
          });
        },
      },
      formatError: (error) => {
        if (config.isProduction) {
          const err: any = {};
          Object.assign(err, error);
          delete err.extensions;
          return err;
        }
        return error;
      },
      context: (context) => {
        let req = context.req;
        if (context.connection) {
          req = context.connection.context.req;
        }
        return { req };
      },
    };
  }

  private async validateToken(authToken: string): Promise<TokenDto> {
    const jwtToken = auth_hdr.parse(authToken).value;
    this.logger.debug(`[validateToken] token ${jwtToken}`);
    return verifyToken(jwtToken, config.session.secret);
  }
}
