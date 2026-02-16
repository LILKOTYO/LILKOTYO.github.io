---
title: "性能优化系统"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "性能优化模块包含对象池、Significance Manager、Tick 聚合等多种优化机制。"
---

# 性能优化系统

## 概述

性能优化模块包含多个子系统和机制，旨在减少 CPU 开销、改善帧率稳定性：
- **Actor 对象池** - 避免频繁的 Spawn/Destroy
- **Significance Manager** - 基于距离的 LOD 和功能降级
- **Tick 聚合** - 减少 Tick 调度开销
- **Deferred Task System** - 帧预算管理
- **尸体管理** - 控制同屏尸体数量

## Actor 对象池

### URogueActorPoolingSubsystem

**文件**: `Source/ActionRoguelike/Performance/RogueActorPoolingSubsystem.h/.cpp`

世界子系统，管理 Actor 的复用池。默认通过 CVar `game.ActorPooling` 控制开关。

**核心 API**：
- `PrimeActorPool(ActorClass, Amount)` - 预创建指定数量的 Actor
- `AcquireFromPool()` - 从池中获取或新建 Actor
- `ReleaseToPool()` - 释放到池中而非销毁

**获取流程**（`AcquireFromPool_Internal`）：
1. 查找对应 Class 的池
2. 有空闲 Actor → 取出、设置 Transform/Instigator/Owner、启用碰撞/显示、DispatchBeginPlay
3. 无空闲 Actor → 标准 SpawnActor

**释放流程**（`ReleaseToPool_Internal`）：
1. 禁用碰撞、隐藏
2. RouteEndPlay
3. 调用 `IRogueActorPoolingInterface::PoolEndPlay`
4. 放入池中

**预热**（GameMode 中配置）：
```cpp
UPROPERTY(EditDefaultsOnly, Category= "Actor Pooling")
TMap<TSubclassOf<AActor>, int32> ActorPoolClasses;
```

### IRogueActorPoolingInterface

**文件**: `Source/ActionRoguelike/Performance/RogueActorPoolingInterface.h`

让 Actor 自定义池化行为的接口：
- `PoolBeginPlay()` - 从池中取出时调用（重置 VFX、恢复音效等）
- `PoolEndPlay()` - 放回池中时调用（暂停 VFX/音效）

## Significance Manager

### URogueSignificanceManager

**文件**: `Source/ActionRoguelike/Performance/RogueSignificanceManager.h/.cpp`

继承 UE 的 `USignificanceManager`，增加 LOD 分桶（Bucket）系统。

**工作原理**：
1. 每帧由 `URogueGameViewportClient::Tick` 驱动 Update
2. 基于所有玩家视角计算每个注册对象的重要性值
3. 按 Tag 分组排序，根据 `URogueSignificanceSettings` 中配置的桶大小分配 LOD
4. LOD 变化时通知对象进行降级/升级

**桶配置** (`URogueSignificanceSettings`)：
```ini
[/Script/ActionRoguelike.RogueSignificanceSettings]
+Buckets=(Tag=AICharacter, BucketSizes=(5, 10, 15))
```
含义：前 5 个最重要的 AI → LOD 0（最高保真），接下来 10 个 → LOD 1，再下 15 个 → LOD 2...

**可伸缩性**: `SigMan.SignificanceBucketSizeMultiplier` CVar 可按平台调整桶大小。

### URogueSignificanceComponent

**文件**: `Source/ActionRoguelike/Performance/RogueSignificanceComponent.h/.cpp`

便捷的重要性管理组件，无需 C++ 基类即可使用。

**特性**：
- 基于距离的重要性等级：Highest、Medium、Lowest、Hidden
- 可配置距离阈值数组
- 支持 `IRogueSignificanceInterface` 自定义计算
- 自动管理 Owner 的 Niagara 粒子重要性
- 隐藏时自动设为最低重要性
- 支持延迟一帧注册（让 VFX 先初始化）

### AI 角色的 Significance 应用

```cpp
void ARogueAICharacter::SignificanceLODChanged(int32 NewLOD)
{
    // 远距离使用 NavWalking（跳过物理模拟）
    EMovementMode MoveMode = NewLOD > 0 ? MOVE_NavWalking : MOVE_Walking;
    GetCharacterMovement()->SetGroundMovementMode(MoveMode);
    // 强制网格 LOD
    GetMesh()->OverrideMinLOD(NewLOD);
}
```

## Tick 聚合

### URogueTickablesSubsystem

**文件**: `Source/ActionRoguelike/Performance/RogueTickablesSubsystem.h/.cpp`

将多个组件的 Tick 合并到一个 TickFunction 中执行，减少调度开销。

**原理**：
- 使用自定义 `FTickablesTickFunction` 注册到标准 Tick 系统
- 组件注册时从标准系统注销自身的 Tick
- 子系统统一调用所有注册组件的 ExecuteTick

**使用**（弹体移动组件为例）：
```cpp
void URogueProjectileMovementComponent::BeginPlay()
{
    URogueTickablesSubsystem* Tickables = GetWorld()->GetSubsystem<URogueTickablesSubsystem>();
    Tickables->RegisterComponent(&PrimaryComponentTick);
}
```

**CVar**: `game.AggregateTicks` 控制开关。

## Deferred Task System

### URogueDeferredTaskSystem

**文件**: `Source/ActionRoguelike/Core/RogueDeferredTaskSystem.h/.cpp`

**编译开关**: `USE_DEFERRED_TASKS` (默认 0 = 关闭)

帧预算管理系统，将非关键任务延迟到帧预算充裕时执行。

**原理**：
- 记录帧开始时间
- Tick 时从队列中取出任务执行
- 当前帧总时间超过预算（1/120 秒）时停止
- 保证每帧至少执行 1ms 的任务，防止队列无限增长

**使用**：
```cpp
URogueDeferredTaskSystem::AddLambda(this, [World, Class, Location]()
{
    World->SpawnActor<AActor>(Class, Location);
});
```

## 尸体管理

### URogueMonsterCorpseSubsystem

**文件**: `Source/ActionRoguelike/Subsystems/RogueMonsterCorpseSubsystem.h/.cpp`

管理 AI 角色死亡后的尸体清理，使用 SPSC 队列。

**策略**：
- 尸体至少保留 `MinimumAge`（10秒）
- 同时最多保留 `MaxCorpses`（5个）
- 超过最大数量时，从最旧的开始清理不在屏幕上的尸体

## 其他性能实践

### 动画预算分配器
AI 角色使用 `USkeletalMeshComponentBudgeted` 替代标准骨骼网格，配合 `IAnimationBudgetAllocator` 在大量 AI 场景下平衡动画计算。

### Overlay Material 优化
AI 和玩家的受击闪烁效果使用 Overlay Material，平时将 `OverlayMaterialMaxDrawDistance` 设为 1（实质禁用），只在受击时临时启用。

### Niagara 优化
- 弹体循环 VFX 使用 `SetPaused` 而非 `Deactivate`，避免重建渲染状态
- 使用 `ENCPoolMethod::AutoRelease` 自动池化粒子系统
