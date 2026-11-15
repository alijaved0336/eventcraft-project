import { GraphQLError } from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { authService } from '../../modules/auth/auth.service';
import { UserModel } from '../../models/user.model';
import { ROLE_PERMISSIONS } from '../../lib/permissions';
import { RegisterInputSchema, LoginInputSchema } from '../../validators/auth.validator';
import type { ApolloContext } from '../../graphql/context';
import type { IUserDocument } from '../../models/user.model';
import { REFRESH_COOKIE_OPTIONS } from '../../config/cookie.config';
import { logger } from '../../lib/logger';

export const authResolvers = {
  DateTime: DateTimeResolver,
  User: {
    id: (parent: IUserDocument) => parent.id ?? parent._id?.toString(),
    _id: (parent: IUserDocument) => parent._id?.toString(),
    permissions: (parent: IUserDocument) => {
      const perms = ROLE_PERMISSIONS[parent.role] || {};
      return Object.entries(perms).map(([action, level]) => ({
        action,
        level,
      }));
    },
  },
  Query: {
    me: async (_: unknown, __: unknown, ctx: ApolloContext) => {
      if (!ctx.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      
      try {
        const user = await UserModel.findById(ctx.user.userId);
        if (!user || !user.isActive) {
          throw new GraphQLError('User no longer exists or is inactive', {
            extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
          });
        }
        return user;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        
        logger.error('Error in me query', { error: (error as Error).message });
        throw new GraphQLError('User no longer exists or is inactive', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
    },
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: unknown }, ctx: ApolloContext) => {
      try {
        const validated = RegisterInputSchema.parse(input);
        const userAgent = ctx.req.headers['user-agent'] as string | undefined;
        const ipAddress = ctx.req.ip || null;

        const { user, accessToken } = await authService.register(
          validated,
          userAgent || null,
          ipAddress,
          ctx.res
        );

        return { user, accessToken };
      } catch (error: unknown) {
        throw new GraphQLError(error instanceof Error ? error.message : 'Registration failed', {
          extensions: { code: 'BAD_USER_INPUT', httpStatus: 400 },
        });
      }
    },

    login: async (_: unknown, { input }: { input: unknown }, ctx: ApolloContext) => {
      try {
        const { email, password } = LoginInputSchema.parse(input);
        
        const user = await UserModel.findOne({ email }).select('+passwordHash');
        if (!user || !(await user.comparePassword(password))) {
          throw new Error('Invalid email or password');
        }

        const userAgent = ctx.req.headers['user-agent'] as string | undefined;
        const ipAddress = ctx.req.ip || null;

        const accessToken = await authService.issueTokenPair(
          user,
          userAgent || null,
          ipAddress,
          ctx.res
        );

        return { user, accessToken };
      } catch (error: unknown) {
        throw new GraphQLError(error instanceof Error ? error.message : 'Authentication failed', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
    },

    logout: async (_: unknown, __: unknown, ctx: ApolloContext) => {
      const token = ctx.req.cookies?.refreshToken as string | undefined;
      if (token) {
        await authService.revokeRefreshToken('', token);
      }
      ctx.res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
      return true;
    },

    logoutAll: async (_: unknown, __: unknown, ctx: ApolloContext) => {
      if (!ctx.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED', httpStatus: 401 },
        });
      }
      await authService.revokeRefreshToken(ctx.user.userId, undefined, true);
      ctx.res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
      return true;
    },
  },
};
