---
title: "世界交互物"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "世界交互物模块包含关卡中的各种可交互 Actor，如宝箱、爆炸桶和靶子。"
---

# 世界交互物

## 概述

世界交互物模块包含关卡中的各种可交互和可互动的 Actor，如宝箱、爆炸桶和靶子。这些物体展示了如何使用 ActionComponent 属性系统、交互接口和曲线动画。

## 核心类

### ARogueTreasureChest（宝箱）

**文件**: `Source/ActionRoguelike/World/RogueTreasureChest.h/.cpp`

可交互的宝箱，实现 `IRogueGameplayInterface`。

**组件**：
- `UStaticMeshComponent` (BaseMesh) - 箱体，启用物理模拟
- `UStaticMeshComponent` (LidMesh) - 箱盖，附加到箱体
- `UNiagaraComponent` (OpenChestEffect) - 开启粒子效果（bAutoManageAttachment）
- `UAudioComponent` (OpenChestSound) - 开启音效（bAutoManageAttachment）

**交互流程**：
1. 玩家交互 → `bLidOpened = true`
2. `ConditionalOpenChest()` 使用 CurveAnimSubsystem 驱动箱盖旋转动画
3. 激活粒子效果和音效

**存档支持**：
- `bLidOpened` 标记为 `SaveGame`，保存时自动序列化
- `OnActorLoaded_Implementation()` 在加载存档后恢复开启状态
- 网络复制通过 `OnRep_LidOpened`

**曲线动画**：
```cpp
AnimSubsystem->PlayCurveAnim(LidAnimCurve, 1.f, [&](float CurrValue)
{
    LidMesh->SetRelativeRotation(FRotator(CurrValue, 0, 0));
});
```

### ARogueExplosiveBarrel（爆炸桶）

**文件**: `Source/ActionRoguelike/World/RogueExplosiveBarrel.h/.cpp`

可被破坏的爆炸桶，使用 ActionComponent 管理生命值。

**组件**：
- `URogueActionComponent` - 使用 `URogueHealthAttributeSet`
- `UStaticMeshComponent` - 物理模拟的桶体
- `URadialForceComponent` - 爆炸径向力
- `UNiagaraComponent` (ExplosionComp) - 爆炸特效
- `UNiagaraComponent` (FlamesFXComp) - 着火特效

**两段式爆炸**：
1. 第一次受击：开始着火（FlamesFX），设置延迟爆炸定时器
2. 第二次受击（或定时器到期）：立即爆炸
3. 爆炸时：径向力冲击、爆炸粒子、关闭着火效果

**属性系统集成**：
```cpp
// 构造函数中设置属性集
ActionComp->SetDefaultAttributeSet(URogueHealthAttributeSet::StaticClass());

// PostInitializeComponents 中监听血量变化
ActionComp->GetAttributeListenerDelegate(SharedGameplayTags::Attribute_Health)
    .AddUObject(this, &ThisClass::OnHealthAttributeChanged);
```

### ARogueTargetDummy（靶子）

**文件**: `Source/ActionRoguelike/World/RogueTargetDummy.h/.cpp`

简单的练习靶子（继承 APawn），受击时材质闪烁。

**特性**：
- 使用 `URogueHealthAttributeSet`
- 受击时通过材质参数 `TimeToHit` 触发视觉反馈
- 实现 `IRogueActionSystemInterface` 接口

## 交互接口

所有可交互物体实现 `IRogueGameplayInterface`：

```cpp
// 执行交互
void Interact(AController* InstigatorController);

// 获取交互提示文本
FText GetInteractText(AController* InstigatorController);

// 存档加载后回调
void OnActorLoaded();
```

交互流程由 `URogueInteractionComponent` 在玩家控制器上驱动，详见[玩家系统](03-Player.md)。
