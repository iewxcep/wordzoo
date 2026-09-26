#!/usr/bin/env python3
"""校验/净化 Earthworm/ELearn 课程包 JSON（三层：包→课程→语句）。

用法: python3 validate.py <课程包.json> [--fix]

--fix: 入库前净化 english——非法标点替换为空格、词尾句点删除、多余空格合并，
       与 API 侧 sanitizeEnglish（course-pack-import.ts）同一套规则，原文件就地重写。
退出码: 0 通过；1 失败（打印所有问题）。
"""
import json
import re
import sys

ALLOWED_CHARS = set("'’.")  # 单引号与小数点；字母/数字/空格放行


def sanitize_english(raw):
    """与 course-pack-import.ts 的 sanitizeEnglish 保持一致。"""
    cleaned = "".join(
        ch if (ch.isalnum() or ch.isspace() or ch in ALLOWED_CHARS) else " "
        for ch in raw
    )
    cleaned = re.sub(r"\.+(?=\s|$)", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def fail(errors, path, msg):
    errors.append(f"{path}: {msg}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    fix = "--fix" in sys.argv[2:]
    path = sys.argv[1]
    errors, warns, fixes = [], [], []

    with open(path, encoding="utf-8") as f:
        raw = f.read()
    if len(raw.encode()) > 20 * 1024 * 1024:
        fail(errors, path, "文件超过 20mb 接口上限，请拆包")
        print("\n".join(errors))
        return 1

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"{path}: JSON 语法错误: {e}")
        return 1

    if not isinstance(data, dict):
        print(f"{path}: 顶层必须是对象")
        return 1

    title = data.get("title")
    if not isinstance(title, str) or not title.strip():
        fail(errors, "title", "缺失或为空")
    elif len(title) > 255:
        fail(errors, "title", f"超过 255 字符（{len(title)}）")
    desc = data.get("description")
    if not isinstance(desc, (str, type(None))):
        fail(errors, "description", "必须是字符串或省略")

    courses = data.get("courses")
    if not isinstance(courses, list):
        print(f"{path}: courses 必须是数组")
        return 1
    if not courses:
        fail(errors, "courses", "为空，至少一门课")

    seen_words = {}
    total_stmts = 0
    for i, course in enumerate(courses):
        cpath = f"courses[{i}]"
        if not isinstance(course, dict):
            fail(errors, cpath, "必须是对象")
            continue
        ctitle = course.get("title")
        if not isinstance(ctitle, str) or not ctitle.strip():
            fail(errors, f"{cpath}.title", "缺失或为空")
        for field in ("description", "video"):
            if not isinstance(course.get(field), (str, type(None))):
                fail(errors, f"{cpath}.{field}", "必须是字符串或省略")
        statements = course.get("statements")
        if not isinstance(statements, list):
            fail(errors, f"{cpath}.statements", "必须是数组")
            continue
        if not statements:
            warns.append(f"{cpath}: statements 为空")
        for j, stmt in enumerate(statements):
            spath = f"{cpath}.statements[{j}]"
            if not isinstance(stmt, dict):
                fail(errors, spath, "必须是对象")
                continue
            for field in ("chinese", "english"):
                val = stmt.get(field)
                if not isinstance(val, str) or not val.strip():
                    fail(errors, f"{spath}.{field}", "缺失或为空")
                elif len(val) > 2000:
                    warns.append(f"{spath}.{field}: 超长（{len(val)} 字符），考虑拆分")
            sm = stmt.get("soundmark")
            if not isinstance(sm, (str, type(None))):
                fail(errors, f"{spath}.soundmark", "必须是字符串或省略")
            elif isinstance(sm, str) and sm.strip() and not (sm.startswith("/") and sm.endswith("/")):
                warns.append(f"{spath}.soundmark: 非 /…/ 格式: {sm!r}")
            eng = stmt.get("english")
            if isinstance(eng, str) and eng.strip():
                if fix:
                    cleaned = sanitize_english(eng)
                    if cleaned != eng:
                        fixes.append(f"{spath}: {eng!r} → {cleaned!r}")
                        stmt["english"] = cleaned
                        eng = cleaned
                    if not cleaned:
                        fail(errors, spath, f"english 净化后为空（全标点语句，导入时会被跳过）: {eng!r}")
                        total_stmts += 1
                        continue
                bad = sorted({
                    ch for ch in eng
                    if not (ch.isalnum() or ch.isspace() or ch in "'’.")
                })
                if bad:
                    fail(
                        errors,
                        spath,
                        f"english 含标点/非法字符 {bad}（仅允许字母、数字、空格、单引号、小数点）: {eng!r}",
                    )
                # 小数点可用，但不得出现在单词结尾（后随空白或串尾）
                if re.search(r"\.(\s|$)", eng):
                    fail(
                        errors,
                        spath,
                        f"english 中小数点/句点出现在单词结尾: {eng!r}",
                    )
                key = eng.strip().lower()
                if key in seen_words:
                    fail(errors, spath, f"english 重复: {eng!r}（首次出现于 {seen_words[key]}）")
                else:
                    seen_words[key] = spath
            total_stmts += 1

    if fix and fixes:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(f"已净化 {len(fixes)} 条 english:")
        print("\n".join(f"  {x}" for x in fixes))
    print(f"统计: {len(courses)} 课, {total_stmts} 条语句, {len(seen_words)} 个去重词条")
    if warns:
        print("警告:")
        print("\n".join(f"  {w}" for w in warns))
    if errors:
        print("错误:")
        print("\n".join(f"  {e}" for e in errors))
        return 1
    print("通过 ✓")
    return 0


if __name__ == "__main__":
    sys.exit(main())
