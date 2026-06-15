import { writable } from "svelte/store";
import { api, type UserDTO } from "../services/api";

export interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Vérifier si on a déjà un token au démarrage
  });

  return {
    subscribe,

    setUser: (user: UserDTO | null) =>
      update((state) => ({
        ...state,
        user,
        isAuthenticated: !!user, // L'opérateur !! en TypeScript (comme en JavaScript) est un opérateur de double négation utilisé pour convertir une valeur en un booléen
      })),

    setLoading: (loading: boolean) =>
      update((state) => ({ ...state, isLoading: loading })),

    logout: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    checkAuth: async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        const user = await api.getMe();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },
  };
}

export const auth = createAuthStore();
