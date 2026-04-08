# NavSphere

NavSphere 是一个基于 `Next.js 16 + React 19 + Supabase` 的开发者导航站，适合把项目入口、内部系统、常用平台和团队工具收敛到同一个可搜索、可分组、可登录管理的界面中。

当前仓库已经不是单纯的初始化模板，而是包含前台导航页、GitHub 登录、个人后台、批量导入接口和 Chrome 书签导出脚本的可运行项目。

## 功能概览

- 首页按分类展示导航链接，支持关键字搜索
- 支持公开数据与用户私有数据共存
- 使用 Supabase Auth + GitHub OAuth 登录
- `/admin` 后台支持分类管理、链接管理、排序与导入
- 支持通过 JSON 批量导入分类与链接
- 提供 Chrome 书签导出脚本，可转换为项目导入格式
- 使用 Supabase RLS 控制数据读写权限

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Database
- Vercel Analytics / Speed Insights

## 项目结构

```text
app/
  page.tsx                 前台导航首页
  login/                   GitHub 登录页
  admin/                   后台页面
  api/import/              普通数据导入接口
components/                前台与后台 UI 组件
lib/data/                  导航查询、后台数据访问、导入逻辑
lib/supabase/              Supabase 客户端封装
data/                      导入示例数据
scripts/                   本地辅助脚本
supabase/schema.sql        数据表、索引、RLS 策略
```

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板

```bash
cp .env.example .env.local
```

3. 在 `.env.local` 中填入 Supabase 配置

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_xxx
```

4. 在 Supabase SQL Editor 执行 [`supabase/schema.sql`](./supabase/schema.sql)

5. 启动开发环境

```bash
npm run dev
```

默认访问地址：`http://localhost:3000`

## 需要配置的 Supabase 内容

### 1. 数据库结构

执行 [`supabase/schema.sql`](./supabase/schema.sql) 后会创建：

- `categories` 分类表
- `links` 链接表
- `link_environment` 枚举类型
- 更新时间触发器
- 检索与排序索引
- 面向匿名用户与登录用户的 RLS 策略

### 2. GitHub 登录

项目当前只保留 GitHub 作为登录方式。

需要在 Supabase Auth 中：

- 启用 GitHub Provider
- 配置 GitHub OAuth Client ID / Secret
- 将回调地址加入配置：`http://localhost:3000/auth/callback`

## 数据访问规则

- 未登录用户只能看到 `is_public = true` 的分类和链接
- 已登录用户可以看到自己的私有数据以及所有公开数据
- 后台增删改操作仅允许作用于当前用户自己的数据
- 空分类不会在前台首页显示

## 导入数据

前端导入面板和接口都支持两种 JSON 结构：

- 单个分类对象
- 分类对象数组

示例文件：

- [`data/data-import.example.json`](./data/data-import.example.json)

单个分类示例：

```json
{
  "category": {
    "name": "AI工具",
    "description": "团队常用的 AI 平台入口",
    "is_public": true
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

接口说明：

- `POST /api/import`

接口会将数据 upsert 到当前登录用户的数据空间中。

### 分类命名约定

分类名称支持路径式命名，例如：

```text
研发 / AI工具
```

这类名称会在前台侧边栏中表现为更清晰的层级分组。

## Chrome 书签导入

仓库内置了 Chrome 书签转换脚本，可将本地书签导出为 NavSphere 可导入的 JSON。

```bash
npm run bookmarks:export
```

默认行为：

- 输入文件：`~/Library/Application Support/Google/Chrome/Default/Bookmarks`
- 输出文件：`.local/chrome-bookmarks.import.json`

可选参数：

```bash
node scripts/export-chrome-bookmarks.mjs --input /path/to/Bookmarks --output .local/bookmarks.json --public
```

`--public` 会将导出的分类和链接标记为公开数据。

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run bookmarks:export
```

## 当前限制

- 当前数据源仅支持 Supabase
- 未配置 Supabase 环境变量时，前台可以打开，但不会读取到导航数据
- 登录方式当前仅支持 GitHub OAuth

## MCP 说明

当前项目本身不依赖 MCP 才能运行。

如果你后续希望通过 Codex 或 Claude Code 直接巡检 Supabase、执行 SQL、批量导入数据或排查 RLS 配置，再接入 Supabase MCP 会更合适。
