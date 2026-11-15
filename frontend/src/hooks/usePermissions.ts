import { useAuthStore, selectCan, PermissionAction, PermissionLevel } from '@/store/authStore';

/**
 * Hook to handle unified permission checks using the Zustand auth store.
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const can = (action: PermissionAction, requiredLevel: PermissionLevel = '✓'): boolean => {
    return selectCan(user, action, requiredLevel);
  };

  return { can };
};
