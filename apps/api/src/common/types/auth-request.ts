import type { Request } from "express";
import type { Role } from "@falcao-erp/shared-types";

export interface AuthenticatedUser {
  userId: string;
  companyId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
