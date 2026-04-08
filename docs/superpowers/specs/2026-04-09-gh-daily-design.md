# gh-daily — GitHub Trending 归档与浏览工具

## 概述

归档 GitHub Trending 历史数据的开源工具。Python 爬虫通过 GitHub Actions 每日抓取，数据以 JSON 存储在仓库中，Astro + React islands 构建静态站点部署到 GitHub Pages，支持带已读状态的回看浏览。

## 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 静态站点框架 | Astro + React islands | 纯静态场景最优，构建产物小，Lighthouse 易达 90+ |
| 部署平台 | GitHub Pages | 免费，数据站点同仓库，无外部依赖 |
| 语言范围 | 仅总榜（不限语言） | 简化初始版本，用户可 fork 后扩展 |
| 已读存储 | localStorage，key 为 `owner/repo` | 无登录、无后端 |

## 架构

```
gh-daily/
├── scraper/
│   ├── scraper.py          # 主爬虫
│   └── requirements.txt    # requests, beautifulsoup4
├── data/
│   └── YYYY/MM/DD/
│       ├── daily.json
│       ├── weekly.json
│       └── monthly.json
├── site/
│   ├── src/
│   │   ├── pages/          # Astro 页面 (index, history, persistent)
│   │   ├── components/     # React 交互组件
│   │   └── lib/            # 数据加载、localStorage、导出工具
│   ├── public/             # 静态资源
│   └── astro.config.mjs
├── .github/workflows/
│   ├── scrape.yml          # 每日爬取 + 提交
│   └── deploy.yml          # 构建 + 部署站点
└── README.md
```

## M1 — 爬虫

### 技术方案

- `requests` + `BeautifulSoup4` 解析 `github.com/trending?since={daily,weekly,monthly}`
- User-Agent 伪装为浏览器，避免被拦截
- 三个周期各请求一次，输出三个 JSON 文件

### 数据 Schema

单条记录：

```json
{
  "repo": "string",
  "owner": "string",
  "description": "string",
  "language": "string | null",
  "total_stars": 12345,
  "stars_period": 678,
  "url": "https://github.com/owner/repo",
  "scraped_at": "2026-04-09T00:00:00Z",
  "trending_type": "daily | weekly | monthly",
  "trending_lang": ""
}
```

每个 JSON 文件是数组，包含该周期所有 trending 仓库（通常 25 条）。

### 幂等性

同一天重复运行覆盖同路径文件。输出路径由运行日期决定。

### 容错

- HTTP 非 200 抛异常，Action 标红
- `stars_period` 解析失败记为 0 并打 warning log

## M2 — GitHub Actions

### scrape.yml

- 触发：`schedule: '0 0 * * *'`（UTC 00:00）+ `workflow_dispatch`
- 步骤：checkout → setup-python → pip install → python scraper/scraper.py → git add data/ → git commit → git push
- commit message: `data: YYYY-MM-DD trending`
- 幂等：`git diff --quiet data/` 时跳过提交

### deploy.yml

- 触发：`push` 到 `main`，`paths: ['data/**', 'site/**']`
- 步骤：checkout → setup-node → npm ci → astro build → actions/deploy-pages
- Astro 构建时从 `data/` 读取 JSON 生成数据索引

## M3 — 静态站点

### 页面

1. **Today（首页）** — 展示今日 trending，三个周期分 tab/分组显示
2. **History** — 日期范围选择器 + 语言/周期筛选 + 按 stars_period 倒序
3. **Persistent** — 所选窗口（7/30 天）内上榜次数最多的仓库，附上榜天数

### 数据加载策略

- 构建时生成日期索引文件（`data/index.json`，列出所有可用日期）
- 运行时按需 fetch 对应日期的 JSON（避免首次加载过大）
- Today 页面数据内联（构建时嵌入最新一天数据）

### 每行展示

仓库名、描述、语言标签、stars_period、total_stars、GitHub 链接、已读/未读切换按钮

### 已读状态

- localStorage key: `gh-daily-read`，value: `{ "owner/repo": true }`
- 已读行视觉淡化（opacity 降低）
- "隐藏已读" 全局开关，也存 localStorage

## M4 — 打磨

### 暗色模式

- CSS `prefers-color-scheme` 自动检测 + 手动切换开关
- 存 localStorage 记住偏好

### 搜索

- 客户端过滤，匹配 repo 名 + description
- 输入防抖 300ms

### 导出 Markdown

- 当前视图数据导出为 Markdown 表格
- 复制到剪贴板 + 下载 .md 文件

### 性能目标

- Lighthouse 性能分 > 90
- Service Worker 缓存实现离线可用（Astro workbox 集成）

## 明确排除

- AI 摘要
- 用户账号 / 云端同步
- 推送通知
- github.com/trending 之外的数据源
- 任何付费服务
