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

## 本地模型

项目已经接好 Ollama 网关。安装 Ollama 后执行 `ollama serve` 和 `ollama pull qwen2.5:3b`，再启动 Next.js。默认模型是 `qwen2.5:3b`，可以通过 `OLLAMA_MODEL` 切换到 `qwen2.5:7b`。本地服务不可用时，提炼和反思会回到可追踪的规则降级，并在返回结果里标记 `provider: fallback`。

可以用 `pnpm llm:check` 检查服务和模型是否已就绪。`scripts/setup-local-llm.sh` 也保留了本地安装后的启动顺序。

### 启动本地 OCR

```bash
python3 -m venv .venv-ocr
source .venv-ocr/bin/activate
pip install -r requirements-ocr.txt
uvicorn scripts.paddle_ocr_service:app --host 127.0.0.1 --port 8001
```

OCR 服务使用 PaddleOCR 识字，再调用本地 `qwen2.5:3b` 只提取公司、base 地、JD 和薪资范围。

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
