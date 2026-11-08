# life / manage

一个给自己用的求职期学习助手。它把项目事实、求职投递、面试题库、学习复习、今日排程和每日反思放在同一个工作台里。

## 已实现

- 项目事实库，候选事实需确认后才显示为已验证
- 求职投递状态机和默认 7 天沉默标记
- 面经文本录入、题目草稿、精确去重提示和回答评分 rubric
- 简化 SM-2 复习间隔
- 纯代码排程器，优先面试、截止日、跟进、固定学习和到期复习
- 日记隐私开关、塔罗边界提醒、关怀信号兜底
- 画像确认队列和事件日志视图
- Drizzle PostgreSQL schema、工具层边界、健康检查 API

## 启动

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。当前演示模式使用浏览器 localStorage，因此不需要先启动 PostgreSQL。

如果需要接数据库，先启动 `docker compose up -d`，再把 `DATABASE_URL` 指向本地 PostgreSQL，并使用 Drizzle Kit 生成迁移。

## 验证

```bash
pnpm test
pnpm typecheck
pnpm build
```

## 后续接入点

- `src/db/schema.ts` 是 PostgreSQL 业务表定义
- `src/lib/tool-layer.ts` 是模型和模块调用的确定性工具边界
- `src/app/api/events/route.ts` 接收调用日志结构
- 真实 LLM 网关、上传存储和 pg-boss 任务应接在这些边界之后
