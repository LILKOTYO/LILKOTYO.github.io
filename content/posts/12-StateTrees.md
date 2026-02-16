---
title: "State Trees（状态树系统）"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "基于 UE State Tree 框架的 AI Director 任务，用于高层次游戏逻辑控制。"
---

# State Trees（状态树系统）

## 概述

State Trees 模块提供基于 UE State Tree 框架的 AI Director 任务，用于替代或补充行为树实现更高层次的游戏逻辑控制，如怪物选择和生成策略。

## 核心类

### FRogueStateTreeDirectorTask

**文件**: `Source/ActionRoguelike/StateTrees/RogueStateTreeTasks.h/.cpp`

State Tree 任务的基类，标记为 `Hidden` 不直接在编辑器中显示。所有自定义 Director 任务继承此类。

### FRogueSTTask_SelectMonster

**文件**: `Source/ActionRoguelike/StateTrees/RogueStateTreeTasks.h/.cpp`

从 DataTable 中选择要生成的怪物的 State Tree 任务。

**实例数据** (`FRogueST_SelectMonsterInstanceData`)：
- `MonsterTable` - 怪物数据表引用
- `AvailableCreditsRef` - 可用积分的属性引用
- `SelectedMonsterRef` - 输出的选中怪物类

**执行逻辑** (`EnterState`)：
1. 从 DataTable 获取所有行
2. 按权重随机选择一行
3. 检查是否有足够积分
4. 通过 AssetManager 获取怪物数据
5. 将结果写入输出引用

### RogueStateTreeDirectorSchema

**文件**: `Source/ActionRoguelike/StateTrees/RogueStateTreeDirectorSchema.h`

自定义 State Tree Schema，定义 Director 可用的任务类型和数据绑定。限制哪些 Task 类型可以在此 Schema 下使用。

## 与行为树的对比

| 特性 | 行为树 (BT) | 状态树 (ST) |
|------|------------|------------|
| 用途 | AI 个体行为决策 | 高层游戏逻辑/AI Director |
| 复杂度 | 中等 | 较新，功能更强 |
| 数据绑定 | 黑板 (Blackboard) | PropertyRef 属性引用 |
| 本项目用法 | AI 角色的战斗行为 | 怪物选择和生成策略 |

## 与 GameMode 的关系

State Tree Director 可以替代 GameMode 中的怪物生成逻辑（`SpawnBotTimerElapsed`），提供更灵活的基于状态的生成策略。当前项目中两种方案共存，可根据需求选择使用。
