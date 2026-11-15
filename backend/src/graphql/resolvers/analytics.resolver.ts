import { GraphQLError } from 'graphql';
import { AnalyticsService } from '../../services/analytics.service';
import { assertAccess } from '../../middleware/rbac';
import { Permission } from '../../lib/permissions';
import type { ApolloContext } from '../context';

export const analyticsResolvers = {
  Query: {
    adminEventAnalytics: async (_: any, { input }: any, context: ApolloContext) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required: Invalid or expired session', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      // Guard with ANALYTICS_VIEW_ALL permission (Admin/SuperAdmin only)
      try {
        await assertAccess(Permission.ANALYTICS_VIEW_ALL, context.user);
      } catch (err: any) {
        throw new GraphQLError(`Forbidden: ${err.message}`, {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return AnalyticsService.getAdminEventAnalytics(input);
    },
  },
  
  EventAnalyticsNode: {
    eventId: (parent: any) => parent._id?.toString() || parent.eventId,
  },

  OrganizerSummary: {
    id: (parent: any) => parent._id?.toString() || parent.id,
  }
};
