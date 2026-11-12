import { useAuth } from '../auth/AuthContext';

// Nome preservado para os consumidores existentes; os dados agora vêm da conta.
export function useLocalProfile(email) {
  const { profileState, saveProfile, refreshProfile } = useAuth();
  return { name: profileState?.data?.name || email?.split('@')[0] || '',
    avatarUrl: profileState?.data?.avatarUrl ?? null,
    loading: !profileState, error: profileState?.error, save: saveProfile, retry: refreshProfile };
}
