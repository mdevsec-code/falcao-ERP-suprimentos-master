import type { LoginResponseDto } from "@falcao-erp/shared-types";
import { apiClient } from "@/api/client";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponseDto>("/auth/login", { email, password }).then((res) => res.data),
  logout: () => apiClient.post("/auth/logout"),
};
