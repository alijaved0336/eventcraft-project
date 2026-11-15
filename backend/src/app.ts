import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import passport from 'passport';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { timingPlugin } from './graphql/plugins/timing.plugin';
import { authTypeDefs } from './graphql/schema/auth.typeDefs';
import { authResolvers } from './graphql/resolvers/auth.resolver';
import { eventTypeDefs } from './graphql/schema/event.typeDefs';
import { eventResolvers } from './graphql/resolvers/event.resolver';
import { orderTypeDefs } from './graphql/schema/order.typeDefs';
import { orderResolvers } from './graphql/resolvers/order.resolver';
import { attendanceTypeDefs } from './graphql/schema/attendance.typeDefs';
import { attendanceResolvers } from './graphql/resolvers/attendance.resolver';
import { livestreamTypeDefs } from './graphql/schema/livestream.typeDefs';
import { livestreamResolvers } from './graphql/resolvers/livestream.resolver';
import { settingsTypeDefs } from './modules/settings/settings.typeDefs';
import { settingsResolvers } from './modules/settings/settings.resolver';
import { analyticsTypeDefs } from './graphql/schema/analytics.typeDefs';
import { analyticsResolvers } from './graphql/resolvers/analytics.resolver';
import { buildApolloContext, type ApolloContext } from './graphql/context';
import { UserModel } from './models/user.model';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { authRouter } from './modules/auth/auth.routes';
import { eventRouter } from './rest/routes/event.routes';
import { sessionRouter } from './rest/routes/session.routes';
import { stripeWebhookRouter } from './rest/routes/stripe-webhook';
import { dailyWebhookRouter } from './rest/routes/webhooks/daily.webhook';
import { livestreamRouter } from './rest/routes/livestream.routes';
import { ticketRouter } from './rest/routes/tickets.routes';
import { initPassport } from './lib/passport';
import { errorHandler } from './middleware/errorhandler';
import { config } from './config';
import { logger } from './lib/logger';

interface RouteInfo {
  path: string;
  methods: string[];
}

interface StackLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
  name?: string;
  handle?: {
    stack?: StackLayer[];
  } & Record<string, unknown>;
}

interface AppRouter {
  stack: StackLayer[];
}

export async function createApp(): Promise<Application> {
  const app = express();

  // Normalize URLs (e.g. //graphql -> /graphql)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.includes('//')) {
      req.url = req.url.replace(/\/+/g, '/');
    }
    next();
  });

  // Middleware
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    config.frontendUrl,
    'https://eventcraftweb.vercel.app',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const cleanOrigin = origin.replace(/\/$/, '');
        const cleanAllowedOrigins = allowedOrigins.map(o => o?.replace(/\/$/, ''));

        if (
          cleanAllowedOrigins.includes(cleanOrigin) || 
          (cleanOrigin.startsWith('https://eventcraft') && cleanOrigin.endsWith('.vercel.app'))
        ) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked request from origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'apollo-require-preflight'],
      exposedHeaders: ['Set-Cookie'],
      optionsSuccessStatus: 200,
    }),
  );
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '500mb' }));
  app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

  // Passport
  initPassport();
  app.use(passport.initialize());

  // Health check (no DB dependency)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'EventCraft API',
      version: '0.1.0',
      docs: '/api/docs',
      health: '/health',
      graphql: '/graphql',
    });
  });

  // Base REST routes
  const swaggerOptions = {
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  };
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
  
  // Webhooks
  app.use('/api/webhooks/stripe', stripeWebhookRouter);
  app.use(
    '/api/webhooks/daily',
    express.raw({ type: 'application/json' }),
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).rawBody = (req as any).body.toString();
      next();
    },
    dailyWebhookRouter
  );

  app.use('/api/auth', authRouter);
  app.use('/api/events', eventRouter);
  app.use('/api/livestream', livestreamRouter);
  app.use('/api/streams', livestreamRouter); // Alias for frontend compatibility
  app.use('/api/sessions', sessionRouter);
  app.use('/api/tickets', ticketRouter);

  // User Avatar REST Endpoint
  app.get('/api/users/:userId/avatar', async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findById(req.params.userId).select('avatar');
      if (!user || !user.avatar) {
        res.status(404).json({ message: 'Avatar not found' });
        return;
      }

      if (user.avatar.startsWith('data:')) {
        const matches = user.avatar.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          res.set('Content-Type', contentType);
          res.send(buffer);
          return;
        }
      }

      res.status(400).json({ message: 'Invalid avatar format' });
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Route Discovery endpoint
  app.get('/api/routes', (_req: Request, res: Response) => {
    try {
      const routes: RouteInfo[] = [];
      const appWithRouter = app as unknown as { _router?: AppRouter; router?: AppRouter };
      const router = appWithRouter._router ?? appWithRouter.router;
      if (!router) {
         (res as any).json({ message: 'EventCraft API', routes: [] });
        return;
      }

      router.stack.forEach((middleware: StackLayer) => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods).map((m) => m.toUpperCase()),
          });
        } else if (middleware.name === 'router' || middleware.handle?.stack) {
          const isAuth = middleware.handle === (authRouter as unknown);
          const base = isAuth ? '/api/auth' : '';

          if (middleware.handle?.stack) {
            middleware.handle.stack.forEach((handler: StackLayer) => {
              if (handler.route) {
                routes.push({
                  path: (base + handler.route.path).replace(/\/+/g, '/'),
                  methods: Object.keys(handler.route.methods).map((m) => m.toUpperCase()),
                });
              }
            });
          }
        }
      });

      (res as any).json({
        message: 'EventCraft API Routes',
        routes: routes.filter((r) => r.path !== '/api/routes'),
      });
    } catch (err: unknown) {
      logger.error('Route discovery error:', { error: err });
      (res as any).status(500).json({ success: false, message: 'Failed to discover routes' });
    }
  });

  // GraphQL Setup
  const server = new ApolloServer({
    typeDefs: [
      `#graphql
      type Query { _empty: String }
      type Mutation { _empty: String }
      `,
      authTypeDefs,
      eventTypeDefs,
      orderTypeDefs,
      attendanceTypeDefs,
      livestreamTypeDefs,
      settingsTypeDefs,
      analyticsTypeDefs,
    ],
    resolvers: [
      authResolvers,
      eventResolvers,
      orderResolvers,
      attendanceResolvers,
      livestreamResolvers,
      settingsResolvers,
      analyticsResolvers,
    ],
    plugins: [
      responseCachePlugin({
        sessionId: async (requestContext) => ((requestContext.contextValue as ApolloContext).user?.userId || null),
      }),
      timingPlugin,
    ],
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: ({ req, res }) => Promise.resolve(buildApolloContext({ req: req as any, res: res as any })),
    }),
  );

  // Error Handler
  app.use(errorHandler);

  return app;
}
