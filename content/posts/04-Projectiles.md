---
title: "弹体系统"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "弹体系统提供传统 Actor 弹体和数据导向弹体两套实现方案。"
---

# 弹体系统

## 概述

弹体系统提供了两套实现方案：传统的 **Actor 弹体**和实验性的**数据导向弹体**。Actor 弹体方案更成熟，集成了对象池、聚合 Tick 等优化；数据导向方案通过 WorldSubsystem 管理无 Actor 的轻量级弹体数据，是一种性能探索。

## Actor 弹体方案

### ARogueProjectile（弹体基类）

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectile.h/.cpp`

所有 Actor 弹体的抽象基类，实现 `IRogueActorPoolingInterface` 支持对象池。

**组件**：
- `USphereComponent` - 碰撞球
- `URogueProjectileMovementComponent` - 自定义移动组件
- `UNiagaraComponent` - 循环粒子效果（飞行拖尾）
- `UAudioComponent` - 飞行音效

**关键特性**：
- 碰撞时调用 `Explode()` 播放爆炸特效、音效和摄像机抖动
- 对象池支持：`PoolBeginPlay` / `PoolEndPlay` 管理 VFX/Audio 的暂停/恢复
- `LifeSpanExpired()` 重写为释放到对象池而非销毁
- 使用 Niagara AutoRelease 池化粒子系统
- 使用 Unreal Insights 计数器追踪活跃弹体数量

### ARogueProjectile_Magic（魔法弹）

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectile_Magic.h/.cpp`

主要攻击弹体，支持伤害、格挡反弹和施加 Buff。

**伤害流程**：
1. 检测重叠（`OnActorOverlap`）
2. 检查目标是否有 ParryTag（格挡），若有则反弹
3. 通过 `CanApplyDamage` 检查是否可以造成伤害
4. 调用 `ApplyDirectionalDamage` 造成方向性伤害（含物理冲量）
5. 可选施加 BurningActionClass（燃烧 Buff）

**格挡机制**：
```cpp
if (OtherActionComp->ActiveGameplayTags.HasTag(ParryTag))
{
    MoveComp->Velocity = -MoveComp->Velocity;  // 反转速度
    SetInstigator(Cast<APawn>(OtherActor));      // 反射者成为弹体拥有者
}
```

### ARogueProjectile_Dash（冲刺弹）

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectile_Dash.h/.cpp`

特殊弹体，在爆炸后将发射者传送到弹体位置。

**流程**：
1. BeginPlay 设置延迟引爆定时器
2. 爆炸时停止移动、禁用碰撞、播放特效
3. 延迟 `TeleportDelay` 秒后传送玩家
4. 传送后播放摄像机抖动
5. 最后销毁弹体（不使用对象池）

### ARogueProjectile_Blackhole（黑洞弹）

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectile_Blackhole.h/.cpp`

黑洞弹体，使用径向力场吸引和销毁物理物体。

**特性**：
- `URadialForceComponent` 持续施加负向径向力
- 仅对 PhysicsBody 通道响应重叠
- 使用 `URogueCurveAnimSubsystem` 驱动径向力半径的动态变化
- 根据生命周期自动计算曲线播放速率

### URogueProjectileMovementComponent

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectileMovementComponent.h/.cpp`

自定义弹体移动组件，与 Tick 聚合子系统集成。

- BeginPlay 时注册到 `URogueTickablesSubsystem`
- EndPlay 时注销
- `Reset()` 方法支持对象池复用

## 数据导向弹体方案

### URogueProjectilesSubsystem

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectilesSubsystem.h/.cpp`

**编译开关**: `USE_DATA_ORIENTED_PROJECTILES` (默认 0 = 关闭)

无 Actor 的弹体管理子系统，所有弹体数据存储在简单数组中。

**运行时数据** (`FProjectileInstance`)：
- Position, Velocity, ID（每帧更新）

**配置数据** (`FProjectileItem`)：
- InitialPosition, InitialDirection, ConfigDataAsset, InstigatorActor, HitResult

**Tick 流程**：
1. 遍历所有弹体实例，计算下一帧位置
2. SweepMultiByChannel 检测碰撞和重叠
3. 处理命中（伤害、友方过滤、VFX）
4. 清理过期弹体

**客户端预测**：
- 客户端生成唯一 ID（基于位置和时间的哈希）
- 客户端立即创建弹体，同时通过 RPC 通知服务端
- 服务端收到时检查是否已存在（避免重复）

### URogueProjectileData

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectileData.h`

弹体配置数据资产，用于数据导向方案：
- ProjectileEffect / ImpactEffect - Niagara 特效
- ImpactDecal_DataChannel - 使用 Niagara Data Channel 的弹痕贴花
- InitialSpeed, Lifespan, DamageCoefficient

### FProjectileArray（网络复制）

**文件**: `Source/ActionRoguelike/Projectiles/RogueProjectileReplication.h/.cpp`

使用 `FFastArraySerializer` 实现高效的弹体数据网络同步：
- `PostReplicatedAdd` - 客户端收到新弹体时创建
- `PreReplicatedRemove` - 弹体移除时清理
- `PostReplicatedChange` - 命中信息更新时播放冲击 VFX

## 伤害计算

弹体伤害使用系数制：
```
实际伤害 = Instigator.AttackDamage × (DamageCoefficient × 0.01)
```
通过 `URogueGameplayFunctionLibrary::ApplyDamage()` 统一处理。
