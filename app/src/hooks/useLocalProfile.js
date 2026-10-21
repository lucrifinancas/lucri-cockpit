import { useEffect, useState } from "react";
import { PROFILE_PREFIX, readProfile, writeProfile } from "../data/localProfile";

// Preferência cosmética local ao navegador, separada da conta no servidor.
const EVENT = "lucri-profile-saved";
export function useLocalProfile(email) {
  const [state, setState] = useState(() => ({ email, profile: readProfile(localStorage, email) }));
  useEffect(() => {
    const refresh = () => setState({ email, profile: readProfile(localStorage, email) });
    refresh();
    const changed = (event) => {
      if (event.type === EVENT ? event.detail === email : event.key === PROFILE_PREFIX + email || event.key === null) refresh();
    };
    window.addEventListener(EVENT, changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener(EVENT, changed);
      window.removeEventListener("storage", changed);
    };
  }, [email]);
  function save(patch) {
    const next = writeProfile(localStorage, email, patch);
    setState({ email, profile: next });
    window.dispatchEvent(new CustomEvent(EVENT, { detail: email }));
  }
  const profile = state.email === email ? state.profile : readProfile(localStorage, email);
  return { name: profile.name || email?.split("@")[0] || "", avatarUrl: profile.avatarUrl ?? null, save };
}
