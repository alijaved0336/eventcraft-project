import { GraphQLError } from 'graphql';
import { SettingsService, type NotificationPrefsInput } from './settings.service';
import { DataExportModel } from '../../models/data-export.model';
import type { ApolloContext } from '../../graphql/context';

const settingsService = new SettingsService();

export const settingsResolvers = {
  Query: {
    myActiveSessions: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.getActiveSessions(context.user.userId, context.tokenFamily);
    },
    myExportStatus: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return DataExportModel.findOne({
        userId: context.user.userId,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });
    },
  },

  Mutation: {
    updateProfile: async (_parent: unknown, { input }: { input: { name?: string; phone?: string; bio?: string } }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.updateProfile(context.user.userId, input);
    },
    uploadAvatar: async (_parent: unknown, { base64Image, mimeType }: { base64Image: string; mimeType: string }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.uploadAvatar(context.user.userId, base64Image, mimeType);
    },
    removeAvatar: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.removeAvatar(context.user.userId);
    },
    requestEmailChange: async (_parent: unknown, { newEmail }: { newEmail: string }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.requestEmailChange(context.user.userId, newEmail);
    },
    confirmEmailChange: async (_parent: unknown, { token }: { token: string }) => {
      return settingsService.confirmEmailChange(token);
    },
    changePassword: async (_parent: unknown, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.changePassword(context.user.userId, currentPassword, newPassword);
    },
    setPassword: async (_parent: unknown, { newPassword }: { newPassword: string }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.setPassword(context.user.userId, newPassword);
    },
    updatePhone: async (_parent: unknown, { phone }: { phone: string }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.updateProfile(context.user.userId, { phone });
    },
    updateNotificationPrefs: async (_parent: unknown, { input }: { input: NotificationPrefsInput }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.updateNotificationPrefs(context.user.userId, input);
    },
    revokeSession: async (_parent: unknown, { sessionId }: { sessionId: string }, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.revokeSession(context.user.userId, sessionId);
    },
    revokeAllOtherSessions: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      if (!context.tokenFamily) throw new GraphQLError('Current session family not identified');
      return settingsService.revokeAllOtherSessions(context.user.userId, context.tokenFamily);
    },
    requestAccountDeletion: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.requestAccountDeletion(context.user.userId);
    },
    cancelAccountDeletion: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.cancelAccountDeletion(context.user.userId);
    },
    requestDataExport: async (_parent: unknown, _args: unknown, context: ApolloContext) => {
      if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      return settingsService.requestDataExport(context.user.userId);
    },
  },
};
