---
name: course-pack
description: 生成 Earthworm/ELearn 课程包 JSON（三层结构：包→课程→语句）并导入到本地应用。当用户要新建英语题库、词汇库、句子课程包，或把词表/课文转成课程包时使用。
---

# 生成课程包（Course Pack）

课程包是一个三层 JSON 文件，由 `importCoursePackData`（apps/api/src/common/course-pack-import.ts）导入到 SQLite。

## 目标格式（与 admin 导出格式一致，校验规则来自 admin/dto/import.dto.ts）

```json
{
  "title": "题库名称（必填，1-255 字符）",
  "description": "可选，一句话说明来源与定位",
  "courses": [
    {
      "title": "课程标题（必填）",
      "description": "可选",
      "video": "可选",
      "statements": [
        { "chinese": "中文（必填，非空）", "english": "English（必填，非空）", "soundmark": "音标，可选" }
      ]
    }
  ]
}
```

硬性约束：
- `title` 非空且 ≤255 字符；`courses`、每课 `statements` 必须是数组
- 每条语句 `chinese`/`english` 非空字符串；`soundmark` 可选（字符串或省略，空串等同省略）
- `english` 中不得出现标点符号——逗号、问号、连字符等一律禁止；唯一例外是小数点 `.`（如 `3.14`），且不得出现在单词结尾（句尾句号、`Mr.` 等缩写点均禁止）。字母、数字、空格、单引号、小数点之外的一切字符都会被校验脚本拒绝
- 单引号允许（缩写如 `don't`、`it's`）
- **入库兜底**：导入接口会自动净化 `english`（`sanitizeEnglish`，course-pack-import.ts）——非法标点替换为空格、词尾句点删除、全标点语句跳过。校验脚本仍应在生成阶段把关，净化只是防线
- 同一包内 `english` 不得重复（重复词条会被应用逐条呈现两次，属于数据缺陷）

## 内容规范（应用是逐条"看中文打英文"的打字学习）

- 语句是**词块/短句粒度**，不是长句：参照内置包 `resources/courses-data/01.json` —— `{"chinese":"喜欢","english":"like","soundmark":"/laɪk/"}`。
- 词汇库：`english`=单词，`soundmark`=IPA 音标（`/…/`），`chinese`=词义（多个释义用 `; ` 分隔，取核心 1-2 个）。
- 句子库：`english`=完整英文句但**不带任何标点**（句尾不加句号/问号，逗号用空格或拆成多条语句表达），`chinese`=整句翻译，`soundmark` 可省略或拼各词音标。
- 课程划分：词汇库按字母/词频/阶段分组，每课 10-20 词；句子库按课文/主题分组，每课 5-15 条。课程标题稳定有序（如 "L01 动物"），导入后按数组顺序排列。
- 内容排序：包内课程按 `courses` 数组顺序，课内语句按数组顺序写入 `order` 字段——按教学难度递进排列。
- 大文件注意：接口 body 上限 20mb；一包尽量 ≤50 课，超出拆包。

## 工作流

1. **收集内容**：从用户提供的词表/课文提取；数据不足时向用户确认词表来源，不要编造词条读音。
2. **生成 JSON**：写出三层结构文件（建议放 `resources/seed-packs/<题库名>.json`，与本仓历史存放位置一致）。
3. **校验/净化**：运行本技能自带校验脚本（相对本技能目录）：
   ```
   python3 scripts/validate.py <课程包.json> [--fix]
   ```
   不带 `--fix` 检查结构、空值、重复词条、english 标点；带 `--fix` 会先就地净化 english（非法标点→空格、词尾句点删除，与 API 入库规则一致）再校验，全标点语句报错提示将被导入跳过。必须通过再导入。
4. **导入**：应用运行时（ELearn 已启动，API 在 127.0.0.1:3001）：
   ```
   curl -s -X POST http://127.0.0.1:3001/admin/course-packs/import \
     -H 'Content-Type: application/json' --data-binary @<课程包.json>
   ```
   成功返回新包 JSON。若应用未运行，提示用户先启动 ELearn（开发环境也可 `npm start` 于 /app/elearn）。
5. **核对**：`curl -s http://127.0.0.1:3001/course-pack | python3 -m json.tool` 确认新包出现、课数正确；抽查一条课程的语句列表。

## 注意

- 导入是追加式的：同名题库再导入会生成第二个重复包。重导前先删除旧包（admin `DELETE /admin/course-packs/:id`）或确认是新内容。
- 生成的 JSON 是数据源，保留在仓库里便于后续维护；不要只导入不落盘。
