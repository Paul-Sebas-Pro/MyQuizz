import { get } from "svelte/store";
import { auth } from "../stores/auth";

export function requireAuth() {
  const authState = get(auth);
  if (!authState.isAuthenticated) {
    window.location.href = "/login";
    return false;
  }
  return true;
}
