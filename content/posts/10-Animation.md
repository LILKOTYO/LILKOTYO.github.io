---
title: "动画系统"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "动画模块包含自定义动画实例、近战检测通知和曲线动画子系统。"
---

# 动画系统

## 概述

动画模块包含自定义动画实例、近战检测的动画通知以及轻量级的曲线动画子系统。

## 核心类

### URogueAnimInstance

**文件**: `Source/ActionRoguelike/Animation/RogueAnimInstance.h/.cpp`

自定义动画实例基类。

**特性**：
- 自动获取 ActionComponent 引用
- 每帧检查 `Status.Stunned` Tag 更新 `bIsStunned`（供动画蓝图使用）
- 提供 `OnMeleeOverlap` 委托，近战 AnimNotify 通过此委托通知 Action

**脚步音效**：
重写 `HandleNotify()` 拦截脚步动画通知（`l_foot_plant` / `r_foot_plant`），播放配置的脚步音效。

### URogueAnimNotifyState_Melee

**文件**: `Source/ActionRoguelike/Animation/RogueAnimNotifyState_Melee.h/.cpp`

近战攻击的动画通知状态（AnimNotifyState），在动画时间段内持续检测攻击碰撞。

**配置**：
- `TraceChannel` - 碰撞通道（默认 ECC_Pawn）
- `SocketName` - 检测中心的骨骼 Socket
- `Radius` - 球形检测半径

**NotifyTick 流程**：
1. 仅在服务端（HasAuthority）执行
2. 获取 Socket 位置作为检测中心
3. `OverlapMultiByChannel` 球形检测
4. 有重叠时通过 `URogueAnimInstance::OnMeleeOverlap` 广播
5. 由监听的 Action（如 `URogueAction_MinionMeleeAttack`）处理伤害

**调试**: CVar `game.drawdebugmelee` 可开启调试球体渲染。

### URogueCurveAnimSubsystem

**文件**: `Source/ActionRoguelike/Animation/RogueCurveAnimSubsystem.h/.cpp`

轻量级曲线动画子系统（WorldSubsystem），替代组件级 Tick 驱动的属性动画。

**两种动画类型**：

#### 1. 曲线动画 (FActiveCurveAnim)
基于 `UCurveFloat` 资产驱动，适合精确控制的动画。

```cpp
AnimSubsystem->PlayCurveAnim(LidAnimCurve, 1.f, [&](float CurrValue)
{
    LidMesh->SetRelativeRotation(FRotator(CurrValue, 0, 0));
});
```

- 自动根据曲线的时间范围播放
- 到达 MaxTime 后自动清理

#### 2. 缓动函数 (FActiveEasingFunc)
基于 `FMath::InterpEaseInOut` 的 0-1 插值，适合简单过渡。

```cpp
AnimSubsystem->PlayEasingFunc(EEasingFunc::EaseInOut, 2.0f, 2.0f, [&](float CurrValue)
{
    LidMesh->SetRelativeRotation(FRotator(CurrValue * 100.f, 0, 0));
});
```

**Tick 管理**：
子系统统一 Tick 所有活跃动画，完成后自动移除（使用 `RemoveAtSwap` 优化）。

## 动画架构图

```
URogueAnimInstance
  ├── 状态变量（bIsStunned 等）→ 动画蓝图使用
  ├── HandleNotify() → 脚步音效
  └── OnMeleeOverlap 委托 → 近战 Action 监听

URogueAnimNotifyState_Melee
  └── NotifyTick() → 球形重叠检测 → OnMeleeOverlap.Broadcast()

URogueCurveAnimSubsystem
  ├── PlayCurveAnim() → 宝箱开盖、黑洞半径变化
  └── PlayEasingFunc() → 简单过渡动画
```
