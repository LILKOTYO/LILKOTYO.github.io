---
title: "Action System（行动系统）"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "Action System 是项目的核心技能/能力框架，管理角色的所有行动和属性系统。"
---

# Action System（行动系统）

## 概述

Action System 是本项目的核心技能/能力框架，类似于 UE 官方的 Gameplay Ability System (GAS)，但更加轻量且易于理解。它负责管理角色的所有行动（技能、Buff/Debuff、被动效果等）以及属性系统（生命值、攻击力等）。

## 核心类

### URogueAction

**文件**: `Source/ActionRoguelike/ActionSystem/RogueAction.h/.cpp`

Action 是所有行动的基类，继承自 `UObject`。每个 Action 代表一个可执行的行动，如攻击、冲刺、Sprint 等。

**关键特性**：
- **GameplayTag 激活**: 通过 `ActivationTag` 标识，可以用 Tag 来启动/停止 Action
- **Tag 阻止机制**: `GrantsTags` 在 Action 激活时添加到拥有者，`BlockedTags` 用于阻止其他 Action 启动
- **冷却系统**: 内置 `CooldownTime` 和 `CooldownUntil` 实现冷却
- **自动启动**: `bAutoStart` 允许 Action 在添加到组件时自动启动（用于 Buff 效果）
- **网络复制**: 通过 `FActionRepData` 结构体实现运行状态的网络同步

**核心方法**：
- `CanStart()` - 检查是否可以启动（未在运行、冷却完成、无阻止 Tag）
- `StartAction()` - 启动行动，添加 GrantsTags，广播事件
- `StopAction()` - 停止行动，移除 GrantsTags，设置冷却

### URogueActionComponent

**文件**: `Source/ActionRoguelike/ActionSystem/RogueActionComponent.h/.cpp`

Action Component 挂载在 Actor 上，管理该 Actor 的所有 Action 和属性。

**关键特性**：
- **Action 管理**: `AddAction()` / `RemoveAction()` / `GetAction()` 管理 Action 列表
- **Tag 快速查找**: `CachedActions` 使用 `TMap<FGameplayTag, URogueAction*>` 实现 O(1) 查找
- **属性系统**: 内置完整的属性系统（Health, AttackDamage, MoveSpeed 等）
- **网络支持**: 使用 `bReplicateUsingRegisteredSubObjectList` 复制子对象
- **Server RPC**: 客户端通过 `ServerStartAction` / `ServerStopAction` 请求服务器执行

**属性操作**：
- `GetAttribute()` / `GetAttributeValue()` - 获取属性
- `ApplyAttributeChange()` - 应用属性变更（支持 AddBase, AddModifier, OverrideBase 三种模式）
- `GetAttributeListenerDelegate()` - 获取属性变更委托，用于监听属性变化

### URogueAttributeSet（属性集）

**文件**: `Source/ActionRoguelike/ActionSystem/RogueAttributeSet.h/.cpp`

属性集定义了一组属性，使用反射自动缓存。

**属性结构 FRogueAttribute**：
- `Base` - 基础值（永久性修改，如升级加点）
- `Modifier` - 临时修改值（Buff/装备效果）
- `GetValue()` - 返回 `Max(Base + Modifier, 0)` 确保非负

**属性集层级**：
```
URogueAttributeSet           - 基类，自动缓存属性
  └─ URogueHealthAttributeSet    - Health, HealthMax（世界物体使用）
      └─ URoguePawnAttributeSet      - + AttackDamage, MoveSpeed（AI/玩家使用）
          ├─ URogueSurvivorAttributeSet  - + Rage, Credits（玩家专用）
          └─ URogueMonsterAttributeSet   - 重写默认值（怪物专用）
```

**自动缓存机制**: `FillAttributeCache()` 使用 `TFieldIterator` 反射遍历所有 `FRogueAttribute` 属性，自动构建 `"Attribute.属性名"` 的 GameplayTag 映射。

### URogueActionEffect

**文件**: `Source/ActionRoguelike/ActionSystem/RogueActionEffect.h/.cpp`

Action Effect 是持续时间效果的基类（Buff/Debuff），继承自 URogueAction。

**特性**：
- `Duration` - 持续时间，到期自动停止
- `Period` - 周期性效果触发间隔
- `ExecutePeriodicEffect()` - 周期性回调（子类实现具体逻辑）
- `bAutoStart = true` - 默认自动启动
- 停止时自动从 ActionComponent 中移除自身

### URogueActionEffect_Thorns（荆棘效果）

**文件**: `Source/ActionRoguelike/ActionSystem/RogueActionEffect_Thorns.h/.cpp`

一个反弹伤害效果的具体实现，监听 Health 变化并反射伤害给攻击者。

**设计亮点**：
- 使用 `Context_Reflected` Tag 避免反射伤害在两个拥有荆棘效果的角色之间无限弹跳

### URogueAction_ProjectileAttack

**文件**: `Source/ActionRoguelike/ActionSystem/RogueAction_ProjectileAttack.h/.cpp`

玩家射弹攻击的 Action 实现。

**流程**：
1. 播放攻击动画和施法粒子效果
2. 延迟 `AttackAnimDelay` 秒后执行实际发射
3. 从摄像机方向做球体扫射确定目标方向
4. 从手部 Socket 位置向目标方向发射弹体
5. 支持 Actor 对象池和数据导向弹体两种模式

### IRogueActionSystemInterface

**文件**: `Source/ActionRoguelike/ActionSystem/RogueActionSystemInterface.h`

提供统一访问 ActionComponent 的接口，AI 角色和玩家角色都实现此接口。

## 属性修改流程

```
ApplyAttributeChange(Tag, Magnitude, Instigator, ModType)
  → 查找属性
  → 根据 ModType 修改 Base/Modifier/Override
  → PostAttributeChanged()（如 Health 钳制在 [0, HealthMax]）
  → 广播 AttributeListenerDelegate（通知 UI、游戏逻辑等）
```

## 网络架构

- **服务端权威**: Action 的添加、启动、停止都在服务端执行
- **客户端预测**: 客户端可以立即启动 Action 的视觉部分
- **RepData 同步**: `OnRep_RepData` 在客户端触发 Start/Stop
- **SubObject 复制**: 使用 `RegisteredSubObjectList` 复制 Action 和 AttributeSet

## 使用示例

### 在 C++ 中添加和启动 Action

```cpp
// 添加 Action（通常在 BeginPlay 或 GameMode 中）
ActionComp->AddAction(GetOwner(), UMyAction::StaticClass());

// 通过 Tag 启动
ActionComp->StartActionByName(this, SharedGameplayTags::Action_PrimaryAttack);

// 修改属性
ActionComp->ApplyAttributeChange(
    SharedGameplayTags::Attribute_Health,
    -25.0f,
    DamageCauser,
    EAttributeModifyType::AddBase
);
```

### 监听属性变化

```cpp
// C++ 监听
ActionComp->GetAttributeListenerDelegate(SharedGameplayTags::Attribute_Health)
    .AddUObject(this, &ThisClass::OnHealthChanged);

// 回调签名
void OnHealthChanged(float NewValue, const FAttributeModification& Mod);
```
