export function createPendingChanges() {
  const entries = new Map();
  return {
    register(key, value) {
      entries.set(key, value);
      return () => entries.delete(key);
    },
    hasPending: () => [...entries.values()].some((item) => item.dirty || item.saving),
    canLeave(confirmDiscard, informSaving) {
      if ([...entries.values()].some((item) => item.saving)) {
        informSaving();
        return false;
      }
      if (![...entries.values()].some((item) => item.dirty)) return true;
      return confirmDiscard();
    },
  };
}
