import { getHttp } from "./http";

export interface AdminCoursePack {
  id: string;
  title: string;
  description: string;
  order: number;
  courseCount: number;
}

export interface AdminStatement {
  id: string;
  order: number;
  chinese: string;
  english: string;
  soundmark: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  order: number;
  coursePackId: string;
  video: string;
  statements: AdminStatement[];
}

export async function fetchAdminCoursePacks() {
  const http = getHttp();
  return (await http<AdminCoursePack[]>("/admin/course-packs", {
    method: "get",
  })) as AdminCoursePack[];
}

export async function createAdminCoursePack(data: { title: string; description?: string }) {
  const http = getHttp();
  return (await http<AdminCoursePack>("/admin/course-packs", {
    method: "post",
    body: data,
  })) as AdminCoursePack;
}

export async function updateAdminCoursePack(
  coursePackId: string,
  data: { title?: string; description?: string; order?: number },
) {
  const http = getHttp();
  return (await http<AdminCoursePack>(`/admin/course-packs/${coursePackId}`, {
    method: "patch",
    body: data,
  })) as AdminCoursePack;
}

export async function deleteAdminCoursePack(coursePackId: string) {
  const http = getHttp();
  return await http(`/admin/course-packs/${coursePackId}`, { method: "delete" });
}

export interface ExportedStatement {
  chinese: string;
  english: string;
  soundmark: string;
}

export interface ExportedCourse {
  title: string;
  description?: string;
  video?: string;
  statements: ExportedStatement[];
}

export interface ExportedCoursePack {
  title: string;
  description?: string;
  courses: ExportedCourse[];
}

export async function fetchExportCoursePack(coursePackId: string) {
  const http = getHttp();
  return (await http<ExportedCoursePack>(`/admin/course-packs/${coursePackId}/export`, {
    method: "get",
  })) as ExportedCoursePack;
}

/** 导入与导出共用同一文件格式 */
export type ImportCoursePackPayload = ExportedCoursePack;

export async function importAdminCoursePack(data: ImportCoursePackPayload) {
  const http = getHttp();
  return (await http<AdminCoursePack & { statementCount: number }>("admin/course-packs/import", {
    method: "post",
    body: data,
  })) as AdminCoursePack & { statementCount: number };
}

/** 把导出数据序列化为格式化 JSON 文件并触发浏览器下载 */
export function downloadExportedCoursePack(data: ExportedCoursePack) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${data.title}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchAdminCourses(coursePackId: string) {
  const http = getHttp();
  return (await http<AdminCourse[]>(`/admin/course-packs/${coursePackId}/courses`, {
    method: "get",
  })) as AdminCourse[];
}

export async function createAdminCourse(
  coursePackId: string,
  data: { title: string; statements: { chinese: string; english: string; soundmark: string }[] },
) {
  const http = getHttp();
  return (await http<AdminCourse>(`/admin/course-packs/${coursePackId}/courses`, {
    method: "post",
    body: data,
  })) as AdminCourse;
}

export async function updateAdminCourse(
  courseId: string,
  data: { title?: string; description?: string; video?: string },
) {
  const http = getHttp();
  return (await http<AdminCourse>(`/admin/courses/${courseId}`, {
    method: "patch",
    body: data,
  })) as AdminCourse;
}

export async function deleteAdminCourse(courseId: string) {
  const http = getHttp();
  return await http(`/admin/courses/${courseId}`, { method: "delete" });
}

export async function updateAdminStatement(
  statementId: string,
  data: { chinese?: string; english?: string; soundmark?: string; order?: number },
) {
  const http = getHttp();
  return (await http<AdminStatement>(`/admin/statements/${statementId}`, {
    method: "patch",
    body: data,
  })) as AdminStatement;
}

export async function deleteAdminStatement(statementId: string) {
  const http = getHttp();
  return await http(`/admin/statements/${statementId}`, { method: "delete" });
}
