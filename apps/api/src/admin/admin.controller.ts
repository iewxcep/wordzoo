import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { AdminService } from "./admin.service";
import { CreateCourseDto, CreateCoursePackDto } from "./dto/create.dto";
import { ImportCoursePackDto } from "./dto/import.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { UpdateCoursePackDto } from "./dto/update-course-pack.dto";
import { UpdateStatementDto } from "./dto/update-statement.dto";

// 本地管理端，单机可信环境，不走 AuthGuard
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("course-packs")
  findCoursePacks() {
    return this.adminService.findCoursePacks();
  }

  @Post("course-packs")
  createCoursePack(@Body() dto: CreateCoursePackDto) {
    return this.adminService.createCoursePack(dto);
  }

  @Patch("course-packs/:id")
  updateCoursePack(@Param("id") id: string, @Body() dto: UpdateCoursePackDto) {
    return this.adminService.updateCoursePack(id, dto);
  }

  @Delete("course-packs/:id")
  removeCoursePack(@Param("id") id: string) {
    return this.adminService.removeCoursePack(id);
  }

  @Post("course-packs/import")
  importCoursePack(@Body() dto: ImportCoursePackDto) {
    return this.adminService.importCoursePack(dto);
  }

  @Get("course-packs/:id/export")
  exportCoursePack(@Param("id") id: string) {
    return this.adminService.exportCoursePack(id);
  }

  @Get("course-packs/:id/courses")
  findCourses(@Param("id") id: string) {
    return this.adminService.findCourses(id);
  }

  @Post("course-packs/:id/courses")
  createCourse(@Param("id") id: string, @Body() dto: CreateCourseDto) {
    return this.adminService.createCourse(id, dto);
  }

  @Patch("courses/:id")
  updateCourse(@Param("id") id: string, @Body() dto: UpdateCourseDto) {
    return this.adminService.updateCourse(id, dto);
  }

  @Delete("courses/:id")
  removeCourse(@Param("id") id: string) {
    return this.adminService.removeCourse(id);
  }

  @Patch("statements/:id")
  updateStatement(@Param("id") id: string, @Body() dto: UpdateStatementDto) {
    return this.adminService.updateStatement(id, dto);
  }

  @Delete("statements/:id")
  removeStatement(@Param("id") id: string) {
    return this.adminService.removeStatement(id);
  }
}
