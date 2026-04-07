# NavSphere

基于 `Next.js + Supabase` 的开发者项目导航站初始化模板，目标是把项目入口、开发工具链接和 AI 工具入口统一整理到一个支持搜索、分类、鉴权和 AI 导入的界面里。

## 当前能力

- 分类分组展示导航
- 搜索项目名、描述、URL 与分类名
- Supabase Auth 登录入口
- Supabase RLS 权限控制
- `POST /api/ai-import` 支持 AI JSON 直接导入
- 未配置 Supabase 时自动回落到 Demo 数据

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

4. 在 Supabase SQL Editor 执行 [`supabase/schema.sql`](./supabase/schema.sql)

## 需要配置的 Supabase 内容

- 开启 Email 登录
- 可选开启 GitHub OAuth
- 在 Authentication 的 URL 配置中加入回调地址：`http://localhost:3000/auth/callback`
- 将项目 URL 和匿名 Key 填入 `.env.local`

## AI 导入格式

示例见 [`data/ai-import.example.json`](./data/ai-import.example.json)。

```json
{
  "category": {
    "name": "AI工具"
  },
  "links": [
    {
      "name": "ChatGPT",
      "url": "https://chatgpt.com",
      "env": "prod"
    }
  ]
}
```

## MCP 说明

这个初始化版本本身不依赖 MCP。

如果你希望 Codex / Claude Code 后续可以直接：

- 查询 Supabase 表结构
- 执行 SQL
- 批量导入导航数据
- 自动巡检 RLS / Auth 配置

那时再补 `Supabase MCP` 或 Supabase CLI 会更合适。
