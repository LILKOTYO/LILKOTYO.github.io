---
title: "开发工具"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "开发工具模块提供作弊管理器和本地开发者设置，方便调试和测试。"
---

# 开发工具

## 概述

开发工具模块提供作弊管理器和本地开发者设置，方便在开发阶段快速调试和测试。

## 核心类

### URogueCheatManager

**文件**: `Source/ActionRoguelike/Development/RogueCheatManager.h/.cpp`

自定义作弊管理器，通过控制台命令触发。在 `ARoguePlayerController` 中配置为 `CheatClass`。

**Exec 命令**：
- `HealSelf` - 完全恢复自身生命值（ApplyAttributeChange 设置 Health 为 HealthMax）
- `KillAll` - 杀死所有指定类的 AI 角色（默认 `ARogueAICharacter`）
- `DeleteSaveGame` - 删除指定槽位的存档文件

**使用方式**：
在游戏运行时打开控制台（`~` 键）输入命令名即可。

### URogueDeveloperLocalSettings

**文件**: `Source/ActionRoguelike/Development/RogueDeveloperLocalSettings.h`

本地开发者设置，存储在本地 INI 文件中，不提交到版本控制。

**配置项**：
- `bDisableSpawnBotsOverride` - 禁用怪物生成（方便测试时不被打扰）

**使用方式**：
在 `DefaultEditorPerProjectUserSettings.ini`（本地文件）中配置：
```ini
[/Script/ActionRoguelike.RogueDeveloperLocalSettings]
bDisableSpawnBotsOverride=true
```

**设计思想**：
- 与 `URogueDeveloperSettings`（项目级、提交到 VCS）不同
- 每个开发者可以有自己的偏好设置
- 不影响其他人的开发环境

## CVar 调试工具一览

项目中散布了大量 CVar 控制的调试功能：

| CVar | 模块 | 功能 |
|------|------|------|
| `game.drawdebugattackrange` | AI | 绘制攻击范围调试线 |
| `game.drawdebugmelee` | Animation | 绘制近战检测球体 |
| `game.ActorPooling` | Performance | 控制 Actor 池开关 |
| `game.AggregateTicks` | Performance | 控制 Tick 聚合开关 |
| `SigMan.SignificanceBucketSizeMultiplier` | Performance | 调整 Significance 桶大小 |

## Unreal Insights 集成

项目使用 `TRACE_CPUPROFILER_EVENT_SCOPE` 和计数器宏进行性能跟踪：

```cpp
TRACE_CPUPROFILER_EVENT_SCOPE(CheckAttackRange);  // 函数级 CPU 追踪
TRACE_COUNTER_INCREMENT(ProjectileCount);          // 弹体计数器
TRACE_COUNTER_SET(ActiveCorpses, Count);           // 尸体数量设置
```

通过 Unreal Insights 工具可以实时观察这些指标。

## 结构化日志

项目使用 `UE_LOGFMT` 进行结构化日志输出：
```cpp
UE_LOGFMT(LogGame, Log, "Actor {Name} killed by {Killer}", ActorName, KillerName);
```

## 屏幕调试日志

全局函数 `LogOnScreen()` 在屏幕上显示带网络角色前缀的调试信息：
```cpp
LogOnScreen(this, FString::Printf(TEXT("Health: %f"), Health));
// 输出: "[Server] Health: 100.0" 或 "[Client] Health: 100.0"
```
