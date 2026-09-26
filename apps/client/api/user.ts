import type { User } from "~/types";
import { getHttp } from "./http";

export async function fetchCurrentUser() {
  const http = getHttp();
  return (await http<User>("/user", { method: "get" })) as User;
}

export interface UpdateUserParams {
  username?: string;
  avatar?: string;
}

export async function fetchUpdateUser(params: UpdateUserParams) {
  const http = getHttp();
  return (await http<User>("/user", {
    method: "patch",
    body: params,
  })) as User;
}
