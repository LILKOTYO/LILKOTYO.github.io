# 我的个人博客

基于 [Hugo](https://gohugo.io/) 搭建的个人博客，采用自定义极简主题 `clean`，支持中文、LaTeX 数学公式、全文搜索、文章目录导航。

## 前置要求

- [Hugo Extended](https://gohugo.io/installation/) v0.128.0 或以上版本

**Windows 安装（推荐使用 Scoop）：**

```powershell
scoop install hugo-extended
```

验证安装：

```powershell
hugo version
```

## 快速开始

### 1. 克隆仓库

```bash
git clone <你的仓库地址> my-blog
cd my-blog
```

### 2. 本地预览

```powershell
hugo server
```

浏览器打开 [http://localhost:1313](http://localhost:1313) 即可预览。

### 3. 构建静态文件

```powershell
hugo
```

构建产物在 `public/` 目录下，可直接部署到任何静态托管服务。

## 目录结构

```
my-blog/
├── archetypes/              # 内容模板
├── content/
│   ├── posts/               # 博文目录
│   │   ├── _index.md
│   │   ├── hello-world.md
│   │   ├── markdown-guide.md
│   │   └── math-table-image-demo.md
│   ├── archives/
│   │   └── index.md         # 归档页面
│   └── about/
│       └── index.md         # 关于页面
├── static/
│   └── img/
│       └── logo.svg         # 网站 Logo
├── themes/clean/            # 自定义极简主题（内嵌，无需 git submodule）
├── hugo.toml                # 站点配置文件
├── .gitignore
└── README.md
```

## 功能特性

| 特性 | 说明 |
|------|------|
| 中文支持 | `hasCJKLanguage = true`，正确处理中文摘要和字数统计 |
| LaTeX 公式 | 行内 `$...$`、块级 `$$...$$`，通过 KaTeX CDN 渲染 |
| Markdown 表格 | 标准管道语法，支持列对齐，悬浮高亮 |
| 图片显示 | 自动居中、圆角、阴影美化，支持本地和远程图片 |
| 全文搜索 | 基于 Fuse.js 的客户端模糊搜索，支持 `Ctrl+K` 快捷键 |
| 文章目录 | 文章页右侧 TOC 侧边栏，sticky 跟随滚动，方便跳转 |
| 标签筛选 | 博文列表页右侧标签云，点击即可按标签过滤文章 |
| 归档页面 | 按年份分组展示所有历史文章 |
| 网站 Logo | 显示在标题栏左侧，可自定义替换 |
| 极简主题 | 内嵌 `clean` 主题，纯白底 + 深灰文字，移动端自适应 |

## 栏目说明

| 栏目 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 欢迎语 + 最新博文列表 |
| 博文 | `/posts/` | 所有文章列表 + 右侧标签云 |
| 归档 | `/archives/` | 按年份分组的完整文章时间线 |
| 关于 | `/about/` | 个人介绍页面 |

## 查找文章的方式

本博客提供多种方式快速找到你想看的文章：

1. **搜索** — 点击导航栏右侧的搜索图标，或按 `Ctrl+K`（Mac 下 `Cmd+K`），弹出搜索框，输入关键词即可模糊匹配标题、标签和摘要
2. **标签筛选** — 在「博文」页面右侧的标签云中点击任意标签，查看该标签下所有文章
3. **归档** — 在「归档」页面按年份浏览所有历史文章
4. **文章目录** — 阅读长文时，右侧 TOC 侧边栏可快速跳转到任意章节

## 写一篇新博文

在 `content/posts/` 目录下创建一个 `.md` 文件，格式如下：

```markdown
---
title: "文章标题"
date: 2026-02-13
draft: false
tags: ["标签1", "标签2"]
description: "文章简要描述"
---

正文内容，使用 Markdown 编写...
```

> **提示**：将 `draft: true` 设置为草稿，本地预览时需加 `--buildDrafts` 参数才会显示。

### 使用 LaTeX 数学公式

行内公式使用单个美元符号包裹：

```markdown
质能方程 $E = mc^2$ 是物理学中最著名的公式。
```

块级公式使用双美元符号：

```markdown
$$\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}$$
```

### 插入图片

远程图片：

```markdown
![描述文字](https://example.com/image.jpg)
```

本地图片 — 将文件放入 `static/img/` 目录，然后引用：

```markdown
![描述文字](/img/my-photo.jpg)
```

## 自定义 Logo

默认 Logo 是一个蓝色圆角方块，位于 `static/img/logo.svg`。替换方式：

1. 将你的 Logo 文件放到 `static/img/` 目录下
2. 编辑 `hugo.toml` 中的 `[params]` 部分：

```toml
[params]
  logo = '/img/your-logo.png'
```

支持 SVG、PNG、JPG 等格式，建议尺寸 32x32 像素。

## 站点配置

编辑根目录下的 `hugo.toml` 可修改：

| 配置项 | 说明 |
|--------|------|
| `title` | 博客标题 |
| `baseURL` | 部署后的网站地址 |
| `[params] author` | 作者名称 |
| `[params] description` | 站点描述 |
| `[params] logo` | Logo 图片路径 |
| `[menu.main]` | 导航栏菜单项 |

## 部署

Hugo 生成的是纯静态文件，你可以部署到：

- **GitHub Pages**：推送到仓库后通过 GitHub Actions 自动构建部署
- **Vercel / Netlify**：连接 Git 仓库后自动识别 Hugo 项目并部署
- **任何 Web 服务器**：将 `public/` 目录内容上传即可

## License

MIT
