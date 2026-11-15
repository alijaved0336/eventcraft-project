import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { CombinedGraphQLErrors } from '@apollo/client';
import { useAuthStore, type User as AuthUser } from '@/store/authStore';
import { toast } from 'sonner';
import { ME_QUERY, UPDATE_NOTIFICATION_PREFS_MUTATION } from '../graphql/operations';
import {
  User as SettingsUser,
  UpdateNotificationPrefsInput,
  UpdateNotificationPrefsMutation,
} from '../types';

/**
 * Hook to manage user notification preferences (Email/SMS).
 * Keeps the global Zustand store in sync with server-side GraphQL updates.
 */
export const useNotificationPrefs = () => {
  const { data, loading, error } = useQuery<{ me: SettingsUser }>(ME_QUERY);
  const { setUser } = useAuthStore();
  const [updatePrefsMutation] = useMutation<UpdateNotificationPrefsMutation>(
    UPDATE_NOTIFICATION_PREFS_MUTATION,
  );

  // Stable refs — avoids stale closures without adding objects to useCallback deps
  const inFlightRef = useRef(false);
  const latestPrefsRef = useRef(data?.me?.notificationPrefs);
  const latestUserIdRef = useRef(data?.me?._id);

  useEffect(() => {
    latestPrefsRef.current = data?.me?.notificationPrefs;
    latestUserIdRef.current = data?.me?._id;
  }, [data?.me?.notificationPrefs, data?.me?._id]);

  // Sync server data to Zustand whenever it changes
  useEffect(() => {
    if (data?.me) {
      const { _id, name, email, notificationPrefs, phone, bio, avatar } = data.me;
      const userToSet: AuthUser = {
        id: _id,
        fullName: name,
        email,
        notificationPrefs,
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(avatar && { avatar }),
      };
      setUser(userToSet);
    }
  }, [data?.me, setUser]);

  const updatePref = useCallback(
    async (input: UpdateNotificationPrefsInput) => {
      // Guard: drop rapid duplicate calls while one is already in-flight
      if (inFlightRef.current) return;

      const currentPrefs = latestPrefsRef.current;
      const currentUserId = latestUserIdRef.current;

      // Guard: ensure user data is loaded before mutating
      if (!currentPrefs || !currentUserId) {
        toast.error('User data not loaded yet, please try again');
        return;
      }

      inFlightRef.current = true;

      try {
        await updatePrefsMutation({
          variables: { input },
          // Apollo reconciles the cache automatically when the real response
          // arrives and rolls back cleanly on error — no manual update() needed.
          optimisticResponse: {
            updateNotificationPrefs: {
              __typename: 'User',
              _id: currentUserId,
              notificationPrefs: {
                email: {
                  ...currentPrefs.email,
                  ...(input.email || {}),
                },
                sms: {
                  ...currentPrefs.sms,
                  ...(input.sms || {}),
                },
              },
            },
          },
        });

        toast.success('Preferences saved ✓');
      } catch (err) {
        let message = 'Failed to update preferences';
        if (CombinedGraphQLErrors.is(err)) {
          message = err.errors[0]?.message || err.message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        toast.error(message);
        // No refetch() needed — Apollo auto-rolls back the optimistic write
        // on error since there is no conflicting update() function.
      } finally {
        inFlightRef.current = false;
      }
      // Stable references only — no object deps that change on every Apollo render
    },
    [updatePrefsMutation],
  );

  return {
    prefs: data?.me?.notificationPrefs,
    loading,
    error,
    updatePref,
  };
};
