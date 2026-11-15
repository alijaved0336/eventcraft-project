import type { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener } from '@apollo/server';
import { logger } from '../../lib/logger';
import type { ApolloContext } from '../context';

/**
 * Apollo Plugin to measure and log GraphQL resolver execution time.
 * Helps identify slow queries in production.
 */
export const timingPlugin: ApolloServerPlugin<ApolloContext> = {
  async requestDidStart(): Promise<GraphQLRequestListener<ApolloContext>> {
    const start = Date.now();
    return {
      async willSendResponse(requestContext: GraphQLRequestContext<ApolloContext>) {
        const duration = Date.now() - start;
        const operationName = requestContext.request.operationName || 'anonymous';
        
        // Log performance metrics
        logger.info(`[GraphQL] ${operationName} → ${duration}ms`, {
          operationName,
          duration,
          query: requestContext.request.query?.slice(0, 100),
        });

        // Add to response extensions for debugging (optional)
        if (requestContext.response.body?.kind === 'single') {
          const body = requestContext.response.body as any;
          if (body.singleResult) {
            body.singleResult.extensions = {
              ...body.singleResult.extensions,
              timing: { totalMs: duration },
            };
          }
        }
      },
    };
  },
};
