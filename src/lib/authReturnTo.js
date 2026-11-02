/**
 * Lê ?returnTo e devolve um caminho interno seguro para navegar após o login.
 * Faz o parse como URL relativa à origem atual: qualquer coisa que resolva para outro host
 * (ex.: "/\evil.com", "/\t/evil.com", "//evil.com") cai em "/".
 */
export function safeReturnTo() {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  if (!returnTo || !returnTo.startsWith("/")) return "/";
  // Barra invertida e caracteres de controle são normalizados pelo navegador em "//host"
  if (/[\\\u0000-\u001f\u007f]/.test(returnTo)) return "/";
  try {
    const url = new URL(returnTo, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
