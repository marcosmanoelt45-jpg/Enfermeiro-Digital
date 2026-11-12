// O avatar da pessoa: fica no aparelho (para aparecer na hora) e no perfil público (para amigos e pódio).
// Quem ainda não montou o seu ganha um sorteado pelo id da conta (sempre o mesmo para a mesma pessoa).
import { useEffect, useState } from "react";
import { normalizarAvatar, sortearAvatar } from "./pecas.js";

export const EVENTO_AVATAR = "enfere:avatar-alterado";
const chave = (id) => `enfere_avatar_${String(id || "anon").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

export function lerMeuAvatar(id) {
  try {
    const raw = localStorage.getItem(chave(id));
    if (raw) return { avatar: normalizarAvatar(JSON.parse(raw)), montado: true };
  } catch {
    /* sem armazenamento */
  }
  return { avatar: sortearAvatar(id || "anon"), montado: false };
}

export function gravarMeuAvatarLocal(id, avatar) {
  try {
    localStorage.setItem(chave(id), JSON.stringify(normalizarAvatar(avatar)));
  } catch {
    /* sem armazenamento */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO_AVATAR));
}

/** Avatar atual da pessoa logada, atualizado quando ela salva um novo. */
export function useMeuAvatar(id) {
  const [estado, setEstado] = useState(() => lerMeuAvatar(id));
  useEffect(() => {
    setEstado(lerMeuAvatar(id));
    const mudou = () => setEstado(lerMeuAvatar(id));
    window.addEventListener(EVENTO_AVATAR, mudou);
    return () => window.removeEventListener(EVENTO_AVATAR, mudou);
  }, [id]);
  return estado;
}
