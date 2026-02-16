---
title: "存档系统"
date: 2026-02-16
draft: false
tags: ["Unreal Engine", "ActionRoguelike"]
description: "存档系统负责游戏状态的保存和加载，使用 UE SaveGame 框架实现跨关卡持久化。"
---

# 存档系统

## 概述

存档系统负责游戏状态的保存和加载，包括玩家数据（Credits、个人记录、位置）和世界 Actor 状态（宝箱开启状态等）。使用 UE 的 SaveGame 框架，通过 GameInstance Subsystem 实现跨关卡持久化。

## 核心类

### URogueSaveGameSubsystem

**文件**: `Source/ActionRoguelike/SaveSystem/RogueSaveGameSubsystem.h/.cpp`

保存/加载的核心子系统，继承 `UGameInstanceSubsystem`（随 GameInstance 生命周期存在）。

**初始化**：
从 `URogueSaveGameSettings` 读取默认存档槽名。

**保存流程** (`WriteSaveGame()`)：
1. 清空当前存档数据
2. 遍历所有 PlayerState，调用 `SavePlayerState()`
3. 遍历世界中所有实现 `IRogueGameplayInterface` 的 Actor
4. 使用 `FMemoryWriter` + `FObjectAndNameAsStringProxyArchive` 序列化标记 `UPROPERTY(SaveGame)` 的属性
5. 保存到磁盘

**加载流程** (`LoadSaveGame()`)：
1. 检查存档是否存在
2. 加载存档到内存
3. 遍历世界中所有实现 `IRogueGameplayInterface` 的 Actor
4. 根据 ActorName 匹配存档数据
5. 恢复 Transform 和序列化数据
6. 调用 `OnActorLoaded()` 通知 Actor 恢复完成

**新玩家处理**：
- `HandleStartingNewPlayer()` - 从存档恢复 PlayerState 数据
- `OverrideSpawnTransform()` - 恢复玩家位置和朝向

### URogueSaveGame

**文件**: `Source/ActionRoguelike/SaveSystem/RogueSaveGame.h`

存档数据容器，继承 `USaveGame`。

**FPlayerSaveData**：
```cpp
FString PlayerID;        // 在线子系统的唯一ID
int32 Credits;           // 货币
float PersonalRecordTime; // 最佳存活时间
FVector Location;        // 位置
FRotator Rotation;       // 朝向
bool bResumeAtTransform; // 是否恢复到保存的位置
```

**FActorSaveData**：
```cpp
FName ActorName;         // Actor 名称（用于匹配）
FTransform Transform;    // 世界变换
TArray<uint8> ByteData;  // 序列化的 SaveGame 属性
```

### URogueSaveGameSettings

**文件**: `Source/ActionRoguelike/SaveSystem/RogueSaveGameSettings.h`

存档配置，通过 DefaultGame.ini 配置存档槽名等。

## 存档触发时机

- **自动存档**: 玩家死亡时（`ARogueGameModeBase::OnActorKilled`）
- **手动存档**: 可通过蓝图调用 `WriteSaveGame()`
- **加载**: 游戏启动时在 `InitGame()` 中加载

## 关键属性标记

只有标记 `UPROPERTY(SaveGame)` 的属性才会被序列化，例如：
```cpp
UPROPERTY(ReplicatedUsing="OnRep_LidOpened", BlueprintReadOnly, SaveGame)
bool bLidOpened;  // 宝箱的 bLidOpened 会被保存
```

## GameMode 集成

```cpp
void ARogueGameModeBase::InitGame(...)
{
    // 游戏启动时加载存档
    URogueSaveGameSubsystem* SG = GetGameInstance()->GetSubsystem<URogueSaveGameSubsystem>();
    SG->LoadSaveGame(SelectedSaveSlot);
}

void ARogueGameModeBase::HandleStartingNewPlayer_Implementation(APlayerController* NewPlayer)
{
    // 恢复玩家数据
    SG->HandleStartingNewPlayer(NewPlayer);
    Super::HandleStartingNewPlayer_Implementation(NewPlayer);
    // 恢复位置
    SG->OverrideSpawnTransform(NewPlayer);
}
```

## 蓝图事件

- `OnSaveGameLoaded` - 存档加载完成
- `OnSaveGameWritten` - 存档写入完成
