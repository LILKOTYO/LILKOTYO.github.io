---
title: "玩家系统"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "玩家系统处理角色控制、输入、技能触发和交互管理。"
---

# 玩家系统

## 概述

玩家系统负责处理玩家角色的控制、输入、技能触发、交互和状态管理。采用 Enhanced Input 系统处理输入，使用 Data Asset 配置输入映射，支持键鼠和手柄操作。

## 核心类

### ARoguePlayerCharacter

**文件**: `Source/ActionRoguelike/Player/RoguePlayerCharacter.h/.cpp`

玩家角色基类（Abstract），继承自 `ACharacter`，实现 `IGenericTeamAgentInterface` 和 `IRogueActionSystemInterface`。

**组件**：
- `USpringArmComponent` + `UCameraComponent` - 第三人称摄像机
- `URogueActionComponent` - 技能和属性管理（使用 `URogueSurvivorAttributeSet`）
- `UAIPerceptionStimuliSourceComponent` - 让 AI 能够感知到玩家
- `UAudioComponent` (AttackSoundsComp) - 攻击音效，使用 `bAutoManageAttachment` 优化

**输入系统**：
使用 Enhanced Input，所有输入绑定通过 `URoguePlayerData` Data Asset 配置：
- `Move` - WASD/摇杆移动，基于控制器旋转方向
- `LookMouse` / `LookStick` - 鼠标/摇杆视角控制
- `StartActionByTag` / `StopActionByTag` - 通过 GameplayTag 触发/停止技能

**手柄辅助瞄准**：
- 每帧通过 `FindCrosshairTarget()` 做异步球形扫射
- 检测到 Pawn 目标时，降低摇杆灵敏度倍率（0.5x），实现"粘滞"效果
- 仅在使用手柄时激活

**受击响应**：
- Overlay Material 闪烁效果（通过 CustomPrimitiveData 传递时间戳给材质）
- 受伤时增加 Rage 属性（等于伤害绝对值）
- 死亡时：播放死亡动画、注销感知刺激源、禁用输入、播放 UI 音效

**性能优化**：
- `bUpdateOverlapsOnAnimationFinalize = false` 跳过动画后的重叠查询
- 骨骼网格生成 Overlap 事件，胶囊体禁用（避免双重触发）
- SpringArm 使用绝对旋转避免胶囊体旋转导致的偏移

### ARoguePlayerController

**文件**: `Source/ActionRoguelike/Player/RoguePlayerController.h/.cpp`

玩家控制器，管理交互和暂停菜单。

**特性**：
- 内置 `URogueInteractionComponent` 交互组件
- 使用 `URogueCheatManager` 作为作弊管理器
- 监听任意键输入判断是否使用手柄（`bIsUsingGamepad`）
- `BeginPlayingState()` 暴露给蓝图用于初始化 UI
- `OnRep_PlayerState` 广播事件通知 PlayerState 可用

**暂停菜单**：
通过 `ARogueHUD::TogglePauseMenu()` 实现，仅在单人模式下实际暂停游戏。

### ARoguePlayerState

**文件**: `Source/ActionRoguelike/Player/RoguePlayerState.h/.cpp`

玩家持久状态，跨关卡和重生保持。

**数据**：
- `Credits` - 货币系统，带网络复制和变更事件
- `PersonalRecordTime` - 个人最佳存活时间

**方法**：
- `AddCredits()` / `TryRemoveCredits()` - 安全的货币操作
- `SavePlayerState()` / `LoadPlayerState()` - 存档读写
- `UpdatePersonalRecord()` - 更新记录（仅在新时间更好时更新）

### URogueInteractionComponent

**文件**: `Source/ActionRoguelike/Player/RogueInteractionComponent.h/.cpp`

交互组件，挂载在 PlayerController 上，负责检测和执行交互。

**检测逻辑**（每帧 Tick）：
1. 球形重叠查找周围可交互物体（使用 `TRACE_INTERACT` 通道）
2. 过滤实现了 `IRogueGameplayInterface` 的 Actor
3. 通过控制器方向的点积计算权重，选择最佳交互目标
4. 显示交互提示 Widget（世界空间 UI）

**执行**：
- `PrimaryInteract()` → `ServerInteract()` (Server RPC) → `IRogueGameplayInterface::Execute_Interact`
- 所有交互逻辑在服务端执行

### URoguePlayerData

**文件**: `Source/ActionRoguelike/Player/RoguePlayerData.h`

数据资产（Data Asset），集中配置玩家的输入映射：
- Move, LookMouse, LookStick, Jump, Sprint
- PrimaryAttack, SecondaryAttack, Dash

好处是可以在编辑器中方便地切换输入配置，无需修改代码。

## 输入绑定架构

```
URoguePlayerData (DataAsset)
  ├── Input_Move → ARoguePlayerCharacter::Move()
  ├── Input_Jump → ACharacter::Jump()
  ├── Input_Sprint (Started) → StartActionByTag(Action.Sprint)
  ├── Input_Sprint (Completed) → StopActionByTag(Action.Sprint)
  ├── Input_LookMouse → ARoguePlayerCharacter::LookMouse()
  ├── Input_LookStick → ARoguePlayerCharacter::LookStick()
  ├── Input_PrimaryAttack → StartActionByTag(Action.PrimaryAttack)
  ├── Input_SecondaryAttack → StartActionByTag(Action.Blackhole)
  └── Input_Dash → StartActionByTag(Action.Dash)

ARoguePlayerController
  └── Input_Interact → PrimaryInteract() → ServerInteract()
```

## 网络架构

- 角色移动由 CharacterMovementComponent 处理（内置网络支持）
- 技能触发通过 ActionComponent 的 Server RPC
- 交互通过 InteractionComponent 的 Server RPC
- Credits 通过 OnRep 在客户端同步
- "被发现"通知使用 Client RPC
