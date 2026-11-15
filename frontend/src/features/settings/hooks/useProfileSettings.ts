import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { CombinedGraphQLErrors, ApolloCache } from '@apollo/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import {
  ME_QUERY,
  UPDATE_PROFILE_MUTATION,
  UPLOAD_AVATAR_MUTATION,
  REMOVE_AVATAR_MUTATION,
  REQUEST_EMAIL_CHANGE_MUTATION,
  SET_PASSWORD_MUTATION,
} from '../graphql/operations';
import type { User, UpdateProfileInput } from '../types';

type UploadAvatarData = { uploadAvatar: { avatar: string } };

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (CombinedGraphQLErrors.is(err)) {
    return err.errors[0]?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

/**
 * Hook to manage profile-related settings.
 * Synchronizes Apollo GraphQL state with the global Zustand authStore.
 */
export const useProfileSettings = () => {
  const { data, loading, error, refetch } = useQuery<{ me: User }>(ME_QUERY);
  const { setUser } = useAuthStore();
  const [updateProfileMutation] = useMutation(UPDATE_PROFILE_MUTATION);
  const [uploadAvatarMutation] = useMutation<UploadAvatarData>(UPLOAD_AVATAR_MUTATION);
  const [removeAvatarMutation] = useMutation(REMOVE_AVATAR_MUTATION);
  const [requestEmailChangeMutation] = useMutation(REQUEST_EMAIL_CHANGE_MUTATION);
  const [setPasswordMutation] = useMutation(SET_PASSWORD_MUTATION);

  const [formData, setFormData] = useState<UpdateProfileInput>({});
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // Stable ref so update callbacks don't capture a stale me._id
  const meIdRef = useRef(data?.me?._id);
  useEffect(() => {
    meIdRef.current = data?.me?._id;
  }, [data?.me?._id]);

  useEffect(() => {
    if (data?.me) {
      const { _id, name, email, notificationPrefs, phone, bio, avatar } = data.me;
      setUser({
        id: _id,
        fullName: name,
        email,
        notificationPrefs,
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(avatar && { avatar }),
      });
    }
  }, [data?.me, setUser]);

  useEffect(() => {
    const me = data?.me;
    if (me) {
      setFormData((prev) => {
        if (
          prev.name === me.name &&
          prev.phone === (me.phone ?? '') &&
          prev.bio === (me.bio ?? '')
        ) {
          return prev;
        }
        return {
          name: me.name,
          phone: me.phone ?? '',
          bio: me.bio ?? '',
        };
      });
    }
  }, [data?.me]);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      try {
        await updateProfileMutation({
          variables: { input },
          refetchQueries: [{ query: ME_QUERY }],
        });
        toast.success('Profile updated successfully');
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to update profile'));
      }
    },
    [updateProfileMutation],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      setIsAvatarUploading(true);
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const base64Image = await base64Promise;
        const mimeType = file.type;

        await uploadAvatarMutation({
          variables: { base64Image, mimeType },
          update: (cache: ApolloCache, { data: uploadData }) => {
            const meId = meIdRef.current;
            if (uploadData?.uploadAvatar && meId) {
              const id = cache.identify({ __typename: 'User', _id: meId });
              if (id) {
                cache.modify({
                  id,
                  fields: {
                    avatar: () => uploadData.uploadAvatar.avatar,
                  },
                });
              }
            }
          },
        });
        toast.success('Avatar uploaded successfully');
        refetch();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to upload avatar'));
      } finally {
        setIsAvatarUploading(false);
      }
    },
    [uploadAvatarMutation, refetch],
  );

  const removeAvatar = useCallback(async () => {
    try {
      await removeAvatarMutation({
        update: (cache: ApolloCache) => {
          const meId = meIdRef.current;
          if (meId) {
            const id = cache.identify({ __typename: 'User', _id: meId });
            if (id) {
              cache.modify({
                id,
                fields: {
                  avatar: () => null,
                },
              });
            }
          }
        },
      });
      toast.success('Avatar removed');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove avatar'));
    }
  }, [removeAvatarMutation, refetch]);

  const requestEmailChange = useCallback(
    async (newEmail: string) => {
      try {
        await requestEmailChangeMutation({ variables: { newEmail } });
        toast.success(`Verification email sent to ${newEmail}`);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to request email change'));
      }
    },
    [requestEmailChangeMutation],
  );

  const setPassword = useCallback(
    async (newPassword: string) => {
      try {
        await setPasswordMutation({ variables: { newPassword } });
        toast.success('Password set successfully');
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to set password'));
      }
    },
    [setPasswordMutation],
  );

  return {
    user: data?.me,
    loading,
    error,
    formData,
    setFormData,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    requestEmailChange,
    setPassword,
    isAvatarUploading,
    refetch,
  };
};
