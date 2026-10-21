export const PROFILE_PREFIX = 'lucri-dash.profile.';

export function readProfile(storage, email) {
  try {
    const parsed = JSON.parse(storage.getItem(PROFILE_PREFIX + email) || '{}');
    return parsed && typeof parsed === 'object' ? {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null,
    } : {};
  } catch { return {}; }
}

export function writeProfile(storage, email, patch) {
  if (!email) throw new Error('Entre na sua conta para salvar o perfil.');
  const previous = readProfile(storage, email);
  const next = {
    name: patch.name === undefined ? previous.name : patch.name,
    avatarUrl: patch.avatarUrl === undefined ? previous.avatarUrl ?? null : patch.avatarUrl,
  };
  storage.setItem(PROFILE_PREFIX + email, JSON.stringify(next));
  return next;
}
