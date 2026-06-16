import { api, type UserDTO } from '../services/api';

class AuthStore {
  user: UserDTO | null = $state(null);
  isLoading: boolean = $state(true);

  get isAuthenticated() {
    return this.user !== null;
  }

  async checkAuth() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { this.user = null; this.isLoading = false; return; }
      this.user = await api.getMe();
    } catch {
      this.user = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      this.isLoading = false;
    }
  }

  async login(email: string, password: string) {
    const { access_token, refresh_token } = await api.login(email, password);
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    this.user = await api.getMe();
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.user = null;
  }
}

export const authStore = new AuthStore();
