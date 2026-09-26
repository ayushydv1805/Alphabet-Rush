const IDENTITY_KEY = "alphabet-rush-identity-token";

export function getIdentityToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(IDENTITY_KEY) || "";
}

export function setIdentityToken(token) {
  if (typeof window === "undefined" || !token) return;
  window.localStorage.setItem(IDENTITY_KEY, token);
}

export function clearIdentityToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(IDENTITY_KEY);
}
