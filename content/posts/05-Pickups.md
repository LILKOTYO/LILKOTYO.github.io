---
title: "拾取物系统"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "拾取物系统包含 Actor 拾取物和数据导向拾取物两套方案。"
---

# 拾取物系统

## 概述

拾取物系统包含两套方案：基于 Actor 的传统拾取物和基于 WorldSubsystem 的数据导向拾取物。前者适合需要交互的物品（如药水、能力拾取），后者适合大量轻量级拾取物（如金币）。

## Actor 拾取物方案

### ARoguePickupActor（拾取物基类）

**文件**: `Source/ActionRoguelike/Pickups/RoguePickupActor.h/.cpp`

所有可拾取物品的抽象基类，实现 `IRogueGameplayInterface` 交互接口。

**组件**：
- `USphereComponent` - 碰撞检测
- `UStaticMeshComponent` - 外观显示

**核心机制**：
- `bCanAutoPickup` - 是否自动拾取（走过就触发），或需要玩家主动交互
- `bIsActive` - 网络复制的激活状态
- `HideAndCooldown()` - 隐藏并在 `RespawnTime` 后重新出现
- `SetPickupState()` - 切换激活状态（碰撞、可见性）

**网络同步**：
- `bIsActive` 使用 `ReplicatedUsing="OnRep_IsActive"` 同步到客户端
- 客户端在 OnRep 中更新碰撞和可见性

### ARoguePickupActor_HealthPotion（生命药水）

**文件**: `Source/ActionRoguelike/Pickups/RoguePickupActor_HealthPotion.h/.cpp`

消耗 Credits 恢复满血的药水。

**交互逻辑**：
1. 检查玩家不是满血
2. 检查玩家有足够 Credits
3. 扣除 Credits
4. 恢复 Health 到 HealthMax
5. 进入冷却隐藏状态

**本地化**：使用 `LOCTEXT_NAMESPACE` 提供本地化交互文本。

### ARoguePickupActor_Credits（金币拾取物）

**文件**: `Source/ActionRoguelike/Pickups/RoguePickupActor_Credits.h/.cpp`

自动拾取的金币，走过即可获得。
- `bCanAutoPickup = true`
- 默认奖励 80 Credits

### ARoguePickupActor_GrantAction（能力拾取物）

**文件**: `Source/ActionRoguelike/Pickups/RoguePickupActor_GrantAction.h/.cpp`

授予玩家一个新 Action 的拾取物。
- 检查玩家是否已拥有该 Action
- 如果没有，添加到 ActionComponent
- 已拥有时显示屏幕消息提示

## 数据导向拾取物方案

### URoguePickupSubsystem

**文件**: `Source/ActionRoguelike/Pickups/RoguePickupSubsystem.h/.cpp`

**编译开关**: `USE_DOD_CREDIT_PICKUPS` (默认 1 = 开启)

使用 Instanced Static Mesh (ISM) 的轻量级金币拾取子系统，可以高效处理大量金币。

**设计特点**：
- 无 Actor 包装器，使用并行数组存储位置、金额和网格实例 ID
- 单个 `UInstancedStaticMeshComponent` 渲染所有金币
- 音效使用 MetaSound，通过 Trigger Parameter 播放递增音高的拾取序列

**数据结构**：
```
CreditPickupLocations[]  ─┐
CreditPickupAmount[]      ├── 三个数组保持同步
MeshIDs[]                ─┘
```

**Tick 流程**（仅在服务端/单机运行）：
1. 收集所有玩家位置
2. 距离检测每个金币与每个玩家
3. 累计每个玩家应获得的总 Credits
4. 批量移除已拾取的金币（反向遍历）
5. 通过属性系统奖励 Credits
6. 播放拾取音效

**网格管理**：
- `CreateWorldISM()` - 延迟初始化 ISM 组件，从 DeveloperSettings 加载网格
- `AddMeshInstance()` / `AddMeshInstances()` - 单个/批量添加
- `RemoveMeshInstances()` - 批量移除

### FPickupLocationsArray（网络复制）

**文件**: `Source/ActionRoguelike/Pickups/RoguePickupItemReplication.h/.cpp`

使用 `FFastArraySerializer` 实现金币位置的高效网络同步。

**客户端同步**：
- `PostReplicatedAdd` - 批量创建网格实例
- `PreReplicatedRemove` - 批量移除网格实例
- `FPrimitiveInstanceId` 使用 `NotReplicated` 标记，仅本地使用

## ISM vs Actor 对比

| 特性 | Actor 方案 | ISM 数据导向方案 |
|------|-----------|----------------|
| 适用场景 | 需要交互的物品 | 大量简单拾取物 |
| 内存开销 | 高（每个一个 Actor） | 低（数组 + 单个 ISM） |
| 渲染效率 | 普通（每个独立 DrawCall） | 高（ISM 合批渲染） |
| 网络带宽 | 每个 Actor 独立复制 | FastArraySerializer 高效同步 |
| 碰撞检测 | UE 碰撞系统 | 手动距离检测 |
| 复杂度 | 低 | 中等 |
