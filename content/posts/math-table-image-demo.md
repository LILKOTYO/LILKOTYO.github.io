---
title: "Markdown 进阶：公式、表格与图片"
date: 2026-02-13T18:00:00+08:00
draft: false
tags: ["Markdown", "LaTeX", "教程"]
description: "演示博客对 LaTeX 数学公式、Markdown 表格和图片的渲染效果。"
---

本文用来演示本博客对 **LaTeX 数学公式**、**Markdown 表格**和**图片**的支持情况。

## 数学公式

### 行内公式

质能方程 $E = mc^2$ 是物理学中最著名的公式之一。

欧拉恒等式 $e^{i\pi} + 1 = 0$ 将五个最重要的数学常数联系在了一起。

一元二次方程 $ax^2 + bx + c = 0$ 的解为 $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$。

### 块级公式

高斯积分：

$$\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}$$

麦克斯韦方程组（微分形式）：

$$\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}$$

$$\nabla \cdot \mathbf{B} = 0$$

$$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$$

$$\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}$$

矩阵运算示例：

$$\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}$$

傅里叶变换：

$$\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) \, e^{-2\pi i x \xi} \, dx$$

## 表格

### 基础表格

| 语言 | 类型 | 用途 |
|------|------|------|
| Python | 解释型 | 数据科学、Web 开发、自动化 |
| Go | 编译型 | 云原生、微服务、CLI 工具 |
| Rust | 编译型 | 系统编程、WebAssembly |
| JavaScript | 解释型 | 前端开发、全栈应用 |

### 数值对比表

| 算法 | 平均时间复杂度 | 最坏时间复杂度 | 空间复杂度 | 稳定性 |
|------|:--------------:|:--------------:|:----------:|:------:|
| 冒泡排序 | $O(n^2)$ | $O(n^2)$ | $O(1)$ | 稳定 |
| 快速排序 | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | 不稳定 |
| 归并排序 | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | 稳定 |
| 堆排序 | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | 不稳定 |

> 表格中也可以嵌入行内 LaTeX 公式。

## 图片

### 在线图片

下面引用一张来自网络的示例图片：

![一座宁静的山湖风景](https://picsum.photos/id/29/800/400)

### 图文说明

Markdown 语法 `![描述](图片URL)` 即可插入图片。如需本地图片，将文件放入 `static/img/` 目录，然后引用：

```markdown
![我的图片](/img/my-photo.jpg)
```

## 综合示例

下表整理了几个经典物理公式：

| 名称 | 公式 | 领域 |
|------|------|------|
| 牛顿第二定律 | $F = ma$ | 经典力学 |
| 质能方程 | $E = mc^2$ | 相对论 |
| 薛定谔方程 | $i\hbar\frac{\partial}{\partial t}\Psi = \hat{H}\Psi$ | 量子力学 |
| 玻尔兹曼熵 | $S = k_B \ln \Omega$ | 统计力学 |

## 小结

本博客现已完整支持：

- **LaTeX 数学公式** — 行内 `$...$` 和块级 `$$...$$`，由 KaTeX 渲染
- **Markdown 表格** — 标准管道语法，支持对齐
- **图片显示** — 本地或远程图片，自动居中和阴影美化

尽情书写吧！
