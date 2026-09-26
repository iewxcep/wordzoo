import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { UpdateUserDto } from "./model/user.dto";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Patch()
  updateInfo(@User() user: UserEntity, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(user, dto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getCurrentUser(@User() user: UserEntity) {
    return await this.userService.findCurrentUser(user.userId);
  }

  // 首次使用时调用：保存用户名并把默认课程包写入学习进度
  @UseGuards(AuthGuard)
  @Post("setup")
  async initializeUser(@User() user: UserEntity, @Body() dto: UpdateUserDto) {
    return this.userService.setupNewUser(user, dto);
  }
}
