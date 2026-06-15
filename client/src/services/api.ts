import { axiosInstance } from "./axios";

export interface UserDTO {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export const api = {
  // AUTH
  async signup(data: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    confirm: string;
  }) {
    const response = await axiosInstance.post("/auth/signup", data);
    return response.data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  async getMe(): Promise<UserDTO> {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await axiosInstance.post("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },

  // USERS
  async getUsers(): Promise<UserDTO[]> {
    const response = await axiosInstance.get("/users");
    return response.data;
  },

  // LEVELS
  async getLevels() {
    const response = await axiosInstance.get("/levels");
    return response.data;
  },

  async getLevel(id: number) {
    const response = await axiosInstance.get(`/levels/${id}`);
    return response.data;
  },

  async createLevel(name: string) {
    const response = await axiosInstance.post("/levels", { name });
    return response.data;
  },

  async updateLevel(id: number, name: string) {
    const response = await axiosInstance.patch(`/levels/${id}`, { name });
    return response.data;
  },

  async deleteLevel(id: number) {
    const response = await axiosInstance.delete(`/levels/${id}`);
    return response.data;
  },
};
