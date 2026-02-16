---
title: "核心框架"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "核心框架包含游戏的基础架构类：GameMode、GameState、全局函数库和接口定义。"
---

# 核心框架

## 概述

核心框架包含游戏的基础架构类：GameMode、GameState、全局函数库、接口定义、共享 GameplayTag 以及各种配置/设置类。

## GameMode

### ARogueGameModeBase

**文件**: `Source/ActionRoguelike/Core/RogueGameModeBase.h/.cpp`

游戏模式基类，管理游戏规则、怪物生成和道具布局。

**默认类配置**：
- PlayerStateClass → `ARoguePlayerState`
- HUDClass → `ARogueHUD`
- GameStateClass → `ARogueGameState`

**怪物生成系统**：
使用积分制（Credit-based）控制怪物生成难度：
1. 每 `SpawnTimerInterval` 秒尝试生成一次
2. 根据 `SpawnCreditCurve` 曲线随时间获得积分
3. 从 `MonsterTable` DataTable 按权重随机选择怪物
4. 检查积分是否足够（`SpawnCost`）
5. 使用 EQS 查找合适的生成位置
6. 通过 AssetManager 异步加载 `URogueMonsterData`
7. 生成 Actor 并通过 MonsterData 配置授予 Action

**道具生成**：
- StartPlay 时通过 EQS 查找所有合适位置
- 随机选择位置和道具类型
- 保证道具间最小距离

**死亡处理**（`OnActorKilled`）：
- 玩家死亡：可选自动重生、保存记录、自动存档
- 击杀奖励：给击杀者的 PlayerState 添加 Credits

### ARogueGameState

**文件**: `Source/ActionRoguelike/Core/RogueGameState.h/.cpp`

游戏状态，持有需要网络复制的全局数据：
- `FProjectileArray ProjectileData` - 数据导向弹体数据
- `FPickupLocationsArray CoinPickupData` - 金币拾取物数据
- `ServerCreateProjectile()` Server RPC - 客户端请求创建弹体

## 全局函数库

### URogueGameplayFunctionLibrary

**文件**: `Source/ActionRoguelike/Core/RogueGameplayFunctionLibrary.h/.cpp`

静态函数库，提供全局通用的游戏功能：

**Actor 查询**：
- `GetActionComponentFromActor()` - 优先通过 `IRogueActionSystemInterface` 接口获取，回退到 `FindComponentByClass`
- `IsAlive()` - 检查 Health > 0
- `IsFullHealth()` - 检查 Health >= HealthMax
- `KillActor()` - 立即杀死目标

**伤害系统**：
- `ApplyDamage()` - 基于攻击者的 AttackDamage × 系数计算伤害
- `ApplyDirectionalDamage()` - 带方向性的伤害（含物理冲量）
- `CanApplyDamage()` - 检查是否可以造成伤害

**伤害公式**：
```
实际伤害 = Instigator.AttackDamage × (DamageCoefficient × 0.01)
```
DamageCoefficient = 100 表示 100% 基础攻击力。

**PSO 缓存**：
- `GetRemainingBundledPSOs()` - 获取剩余的 PSO 预编译数量（用于 UI 显示加载进度）

## 接口

### IRogueGameplayInterface

**文件**: `Source/ActionRoguelike/Core/RogueGameplayInterface.h`

世界交互物的通用接口：
- `Interact()` - 交互执行
- `GetInteractText()` - 获取交互提示文本
- `OnActorLoaded()` - 存档加载后恢复状态

## 共享 GameplayTag

### SharedGameplayTags

**文件**: `Source/ActionRoguelike/SharedGameplayTags.h`

集中定义项目使用的 Native GameplayTag：

| 分类 | Tag | 用途 |
|------|-----|------|
| Action | Action.Sprint | 冲刺 |
| Action | Action.PrimaryAttack | 主攻击 |
| Action | Action.Blackhole | 黑洞技能 |
| Action | Action.Dash | 冲刺闪避 |
| Action | Action.Melee | 近战攻击 |
| Status | Status.Stunned | 眩晕状态 |
| Context | Context.Reflected | 反射伤害标记 |
| Attribute | Attribute.Health | 生命值 |
| Attribute | Attribute.HealthMax | 最大生命值 |
| Attribute | Attribute.AttackDamage | 攻击力 |
| Attribute | Attribute.Rage | 怒气 |
| Attribute | Attribute.Credits | 金币 |
| Attribute | Attribute.MoveSpeed | 移动速度 |
| Message | Message.MonsterKilled | 怪物击杀消息 |

## 全局常量和工具

### ActionRoguelike.h

**文件**: `Source/ActionRoguelike/ActionRoguelike.h`

项目全局头文件，定义：

**日志**: `DECLARE_LOG_CATEGORY_EXTERN(LogGame, Log, All)`

**碰撞通道别名**：
- `COLLISION_PROJECTILE` = ECC_GameTraceChannel1
- `TRACE_INTERACT` = ECC_GameTraceChannel2

**队伍 ID**：
- `TEAM_ID_BOTS` = 1
- `TEAM_ID_PLAYERS` = 2

**命名空间常量**：
- `Animation::NAME_Foot_Plant_L/R` - 脚步动画通知名
- `Collision::Ragdoll/Projectile/Powerup_ProfileName` - 碰撞预设名
- `MeshSockets::RightHandMuzzle/LeftHandMuzzle` - 骨骼 Socket 名

**调试函数**: `LogOnScreen()` - 带网络前缀的屏幕日志

## 消息系统

### URogueMessagingSubsystem

**文件**: `Source/ActionRoguelike/Core/RogueMessagingSubsystem.h/.cpp`

**编译开关**: `USE_TAGMESSAGING_SYSTEM` (默认 0 = 关闭)

基于 GameplayTag 的消息系统（GameInstance 子系统），使用 `FInstancedStruct` 传递任意类型的消息负载。

## 加载画面

### URogueLoadingScreenSubsystem

**文件**: `Source/ActionRoguelike/Core/RogueLoadingScreenSubsystem.h/.cpp`

简单的加载画面子系统，监听地图加载事件显示/隐藏过渡画面。

## 视口

### URogueGameViewportClient

**文件**: `Source/ActionRoguelike/Core/RogueGameViewportClient.h/.cpp`

自定义视口客户端，每帧驱动 SignificanceManager 更新，收集所有玩家视角作为评估点。

## 开发者设置

### URogueDeveloperSettings

**文件**: `Source/ActionRoguelike/Core/RogueDeveloperSettings.h/.cpp`

项目级配置（DefaultGame.ini），如拾取物网格和音效引用。

### URogueMonsterData

**文件**: `Source/ActionRoguelike/Core/RogueMonsterData.h`

怪物数据资产（PrimaryDataAsset），定义：
- `MonsterClass` - 怪物蓝图类
- `Actions` - 要授予的 Action 列表
- `Icon` - UI 图标
- 使用 AssetManager 支持异步加载
