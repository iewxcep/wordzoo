import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

export const LOCAL_USER_ID = "local-user";

/**
 * 单机模式没有登录：所有请求都视为本地用户。
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request["userId"] = LOCAL_USER_ID;
    return true;
  }
}
