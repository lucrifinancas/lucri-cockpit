import { useEffect, useState } from "react";

// Nome de exibição e avatar são só cosméticos — o backend real não tem
// campos pra isso (`user` = { email, papel, cliente_id }, ver
// API-CONTRACT.md). Guarda por e-mail, local ao navegador; não sincroniza
// entre dispositivos.
const STORAGE_PREFIX = "lucri-dash.profile.";

function emailPrefix(email) {
  return email?.split("@")[0] ?? "";
}

function read(email) {
  const raw = email && localStorage.getItem(STORAGE_PREFIX + email);
  return raw ? JSON.parse(raw) : {};
}

export function useLocalProfile(email) {
  const [profile, setProfile] = useState(() => read(email));

  useEffect(() => {
    setProfile(read(email));
  }, [email]);

  function save({ name, avatarUrl }) {
    const next = { name, avatarUrl: avatarUrl ?? profile.avatarUrl ?? null };
    if (email) localStorage.setItem(STORAGE_PREFIX + email, JSON.stringify(next));
    setProfile(next);
  }

  return {
    name: profile.name || emailPrefix(email),
    avatarUrl: profile.avatarUrl ?? null,
    save,
  };
}
