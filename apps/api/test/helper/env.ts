import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// jest setupFiles：在任何模块加载前固定测试环境变量，
// 保证 SQLITE_DB_PATH / MIGRATIONS_DIR 与本机安装的 Postgres/Redis 无关。
process.env.NODE_ENV = "test";

if (!process.env.SQLITE_DB_PATH) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "earthworm-api-test-"));
  process.env.SQLITE_DB_PATH = path.join(tmpDir, "test.db");
}

if (!process.env.MIGRATIONS_DIR) {
  // test/helper -> test -> apps/api -> apps -> repo root
  process.env.MIGRATIONS_DIR = path.resolve(__dirname, "../../../../packages/db/drizzle");
}
