---
title: "ActionRoguelike 项目入门指南"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "ActionRoguelike 项目概览与快速导航，包含项目简介和文档索引。"
---

# ActionRoguelike 项目入门指南

## 项目简介

ActionRoguelike 是一个基于 **Unreal Engine** 的 C++ 第三人称动作 Roguelike 游戏项目。项目展示了从自定义技能系统、AI 行为、网络复制到性能优化等多种 UE 开发技术。

## 快速导航

| 文档 | 内容 | 适合阅读时机 |
|------|------|-------------|
| [01-ActionSystem](01-ActionSystem.md) | 技能/属性框架 | **最先阅读** - 项目核心 |
| [02-AI](02-AI.md) | AI 角色与行为树 | 了解 Action System 后 |
| [03-Player](03-Player.md) | 玩家角色与输入 | 了解 Action System 后 |
| [04-Projectiles](04-Projectiles.md) | 弹体系统 | 了解 Action 和 Player 后 |
| [05-Pickups](05-Pickups.md) | 拾取物系统 | 随时 |
| [06-World](06-World.md) | 世界交互物 | 随时 |
| [07-SaveSystem](07-SaveSystem.md) | 存档系统 | 随时 |
| [08-Performance](08-Performance.md) | 性能优化 | 有一定基础后 |
| [09-Core](09-Core.md) | 核心框架与全局工具 | 需要查阅时 |
| [10-Animation](10-Animation.md) | 动画系统 | 随时 |
| [11-UI](11-UI.md) | UI 系统 | 随时 |
| [12-StateTrees](12-StateTrees.md) | State Tree 任务 | 有一定基础后 |
| [13-Development](13-Development.md) | 开发与调试工具 | 需要调试时 |

## 推荐阅读顺序

如果你是刚接触这个项目的新手，建议按照以下路径阅读：

```
1. 本文档（了解项目全貌）
      ↓
2. Action System（理解核心技能/属性框架）
      ↓
3. Player（理解玩家如何操作角色）
      ↓
4. AI（理解敌人如何运作）
      ↓
5. Projectiles（技能如何产生弹体）
      ↓
6. 其余模块按需阅读
```

## 项目结构

```
ActionRoguelike/
├── Source/ActionRoguelike/          # C++ 源代码
│   ├── ActionSystem/                # 技能和属性系统
│   ├── AI/                          # AI 角色、控制器、行为树节点
│   ├── Player/                      # 玩家角色、控制器、状态
│   ├── Projectiles/                 # 弹体系统（Actor 方案 + 数据导向方案）
│   ├── Pickups/                     # 拾取物系统（Actor 方案 + ISM 方案）
│   ├── World/                       # 世界交互物（宝箱、爆炸桶、靶子）
│   ├── Core/                        # GameMode、GameState、全局工具
│   ├── Performance/                 # 对象池、Significance、Tick 聚合
│   ├── Animation/                   # 动画实例、通知、曲线动画
│   ├── UI/                          # HUD、世界空间 Widget
│   ├── SaveSystem/                  # 存档/加载
│   ├── Subsystems/                  # 尸体管理等子系统
│   ├── StateTrees/                  # State Tree 任务
│   ├── Development/                 # 作弊器、开发者设置
│   ├── ActionRoguelike.h            # 全局头文件（碰撞通道、常量）
│   └── SharedGameplayTags.h         # 共享 GameplayTag 定义
├── Content/                         # 蓝图、资产、关卡
├── Config/                          # 引擎和项目配置
└── docs/                            # 项目文档（你正在看的）
```

## 核心概念速查

### 1. Action System（自定义 GAS）

这是项目最重要的系统。理解它后其他一切都会变得清晰。

- **URogueAction** - 所有技能/行动的基类
- **URogueActionComponent** - 挂在角色上，管理 Action 和属性
- **URogueAttributeSet** - 定义角色属性（生命值、攻击力等）
- **GameplayTag** - 用 Tag 标识和触发 Action

**关键流程**：玩家按键 → 触发 `StartActionByTag` → ActionComponent 找到对应 Action → 调用 `StartAction()` → 执行具体逻辑（如发射弹体）

详见 [Action System 文档](01-ActionSystem.md)。

### 2. GameplayTag

项目大量使用 GameplayTag 进行松耦合的标识和通信。所有 Tag 集中定义在 `SharedGameplayTags.h` 中：

- `Action.*` - 标识各种技能（PrimaryAttack、Sprint、Dash...）
- `Status.*` - 标识状态（Stunned）
- `Attribute.*` - 标识属性（Health、AttackDamage...）
- `Context.*` - 上下文标记（Reflected 反射伤害标记）

### 3. 网络架构

项目支持多人游戏，采用服务端权威模型：
- 所有游戏逻辑在服务端执行
- 客户端通过 **Server RPC** 请求操作
- 数据通过 **属性复制**（`ReplicatedUsing`）同步
- 大量数据使用 **FFastArraySerializer** 高效同步

### 4. 性能优化

项目展示了多种 UE 性能优化技术：
- **Actor 对象池** - 复用弹体 Actor，避免频繁创建/销毁
- **Significance Manager** - 远处的 AI 降低更新频率和动画品质
- **Tick 聚合** - 将多个组件的 Tick 合并成一个
- **数据导向设计** - 用数组替代 Actor 管理弹体/拾取物

详见 [性能优化文档](08-Performance.md)。

### 5. 实验性功能（编译开关）

部分功能通过宏开关控制，位于各自的头文件中：

| 宏 | 默认值 | 功能 |
|----|--------|------|
| `USE_DATA_ORIENTED_PROJECTILES` | 0 (关) | 数据导向弹体 |
| `USE_DOD_CREDIT_PICKUPS` | 1 (开) | ISM 数据导向金币 |
| `USE_DEFERRED_TASKS` | 0 (关) | 帧预算任务延迟系统 |
| `USE_TAGMESSAGING_SYSTEM` | 0 (关) | Tag 消息系统 |

## UE 知识前置要求

阅读本项目代码前，建议了解以下 UE 概念：

1. **C++ 基础** - UCLASS、UPROPERTY、UFUNCTION 宏
2. **Actor / Component 模型** - UE 的组件化架构
3. **GameMode / GameState** - 游戏规则和状态管理
4. **Enhanced Input** - UE5 的输入系统
5. **网络复制** - DOREPLIFETIME、RPC、OnRep
6. **行为树** - Task、Service、Decorator
7. **GameplayTag** - 层级化标签系统

## 常见开发场景

### "我想添加一个新技能"

1. 创建 `URogueAction` 的子类
2. 在 `SharedGameplayTags.h` 添加对应 Tag
3. 在 `URoguePlayerData` 添加输入绑定
4. 在角色蓝图或 GameMode 的 MonsterData 中授予该 Action

### "我想添加一个新的 AI 怪物"

1. 创建 `ARogueAICharacter` 的蓝图子类
2. 创建 `URogueMonsterData` 数据资产，配置类和 Action
3. 在 GameMode 的 `MonsterTable` DataTable 中添加条目
4. 配置行为树（可复用现有的）

### "我想添加一个新的拾取物"

1. 创建 `ARoguePickupActor` 的子类
2. 重写 `Interact()` 实现拾取逻辑
3. 在 GameMode 的 `PowerupClasses` 中注册

### "我想调试性能问题"

1. 使用 Unreal Insights 查看 CPU 追踪
2. 检查 CVar `game.ActorPooling`、`game.AggregateTicks` 是否开启
3. 查看 Significance Manager 的桶配置
4. 参考 [性能优化文档](08-Performance.md) 了解各优化系统

## 构建和运行

1. 确保安装了对应版本的 Unreal Engine
2. 双击 `ActionRoguelike.uproject` 打开项目
3. 在 UE 编辑器中点击 Play 运行
4. 使用 `~` 键打开控制台，输入作弊命令调试（参考 [开发工具文档](13-Development.md)）
