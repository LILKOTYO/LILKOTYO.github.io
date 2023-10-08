---
sidebar_position: 6
---

# Gameplay 框架

## Object（UObject）
UObject 几乎是虚幻引擎里面所有 C++ 类和蓝图类的直接或间接基类。
UObject 为所有派生类提供了垃圾回收（Garbage Collection），反射（Reflection），元数据（MetaData），序列化（Serialization）等基础功能，让所有派生类能够在C++代码层面实现与虚幻引擎更密切地配合。

## Actor（AActor）
既然是3D引擎，那自然少不了要在场景里面摆放物体或在场景里生成物体的步骤，因此 UObject 派生了一个可放置于场景中的类型——— Actor。
除了能够被摆放到场景里以外，Actor 还提供了网络复制（Replication）、生成（Spawn）、Tick 等功能。

Actor 自己并不会自带一个 Transform，因为虽然 Actor 主要是可被放置到场景中的类型，但是这并不代表该类型“可见”，例如游戏模式（AGameMode）、游戏状态（AGameState）等这类类型依然可放置（或者更确切地描述是“生成”）在场景中，但是它们都是不可见的。因此Actor更确切的定义是场景中的“元素”，小到一块石头模型，大到游戏规则，都可以是Actor。

## Component（UActorComponent）
我们可以在上文提到的Actor里编写功能代码，但是如果我们把所有功能代码都写进一个 Actor 里面，会让这个 Actor 变得臃肿不堪，因此 UE4 引擎提供了一个类型，允许将 Actor 的功能代码封装进这个新类型里，并让该类型成为 Actor 的组成部分，然后又能反作用于 Actor，这样既能能实现代码的复用，又减轻了 Actor 的负担，这个新类型就是“组件（Component）”类型。

就像一棵树木会有一个根一样，每个 Actor 也会有一个“根组件”，也就是底层代码里面的成员变量`USceneComponent* RootComponent`。

组件最基础的类型是 UActorComponent ，该类型是通过直接继承基类 UObject 得来的。该组件支持一些可在场景中生成但是“不可见”的功能，如 UMovementComponent 提供的移动功能。

UActorComponent 最重要的派生类是 USceneComponent ，因为该派生类在基类 UActorComponent 的基础上添加了“变换”功能，允许我们在场景里面调整该组件（甚至是调整使用该组件的 Actor）的各种位置、旋转、缩放信息。可以说一切在场景里面“可见”的组件，都是由 USceneComponent 继承而来的。如 UMeshComponent、UStaticMeshComponent 组件分别提供了可见的展示骨骼网格体和静态网格体的功能。

## Level（ULevel）
丰富多彩的 Actor 和 Component 构成了一个个功能强大的对象，现在需要有一个容器能够存放下这些所有的对象，存放这些所有元素的对象就是 UE 提供的 ULevel 类型。

从关卡（Level）类型在C++代码里命名可知，Level 类型也是继承自 UObject 类型的。
既然是继承自 UObject 类型，那自然也会继承了 UObject 提供的各种特性，其中也包括“编写脚本”的能力，因此每个 ULevel 对象也都自带了一个 ALevelScriptActor 对象用来实现“关卡蓝图”的功能。
关卡本身也需要支持一些可自定义的属性，例如设置关卡里的光照贴图、本关卡使用的游戏模式等等，因此该类型也自带着一个“书记官”——— AWorldSettings 类型用于记录这些每个关卡本身的可自定义属性。

关卡本身支持添加多个子关卡，又因为每个关卡都可以定义自己的游戏模式等属性，因此当一个“持久性关卡（Persistent Level）”里面被添加了多个子关卡时，实际使用到的 AWorldSettings 对象只会是持久性关卡的那一个。

关卡的作用是用来存放 Actor及其派生类，因此关卡本身会有一个变量`TArray<AActor*> Actors`用来存放关卡内所有生成的 Actor，ALevelScriptActor 和 AWorldSettings 也理所当然地被保存到该数组里面。

## World（UWorld）
很多时候仅仅只有一个关卡是不够的，如果我们的游戏场景尺寸非常巨大，要将这些庞大数量的 Actor 全部都塞进一个关卡里，势必会造成关卡的臃肿和维护的困难，若我们将这个巨大的场景根据一定规则划分，并能够实现在我们需要的时候读取一部分内容，或者释放掉我们不需要的内容，无论是在性能上还是开发过程都会起到良好的作用。因此 UE 引擎提供了一个能够容纳多个关卡的类型——— World。

UWorld 类型是从 UObject 类型直接继承而来的，并添加了多个数组用于保存子关卡及其各自的 Actors，以及保存了指向“Persistent Level”和“Current Level”的指针。
UWorld 使用的关卡就是“Persistent Level”，也就是项目编辑器视口打开了的持久性关卡，而 UWorld 使用的AWorldSettings 也就是持久性关卡的 AWorldSettings。但并不是说其他子关卡的 AWorldSettings 就完全没有用，部分配置例如光照配置，就是使用的各自关卡 AWorldSettings 的设置而不是照搬持久性关卡的设置。
UWorld 里面可以访问得到所有关卡（包括持久性关卡和子关卡）里的所有 Actor，但是并不是说 UWorld 直接保存这些 Actors，而仅仅只是通过遍历 ULevel 然后再遍历其Actor。

## WorldContext（FWorldContext）
在UE引擎中，有些时候（例如开发的时候）并不会只存在一个 World，因此 UE 引擎提供了一个类型来管理多个 World ——— FWorldContext。需要注意这个类型以F开头，也就是说该类型不再派生自 UObject 或 AActor。
对于独立运行的游戏， WorldContext 只有唯一的一个（Game WorldContext）；对于编辑器模式，则是一个 WorldContext 给编辑器（Editor Context），一个 WorldContext 给 PIE（PIE WorldContext），甚至还会有其他的 WorldContext，如编辑器视图里面还没有运行的游戏场景的 World（Preview World）
FWorldContext 类型的成员变量 `UWorld* ThisCurrentWorld` 会指向当前的 World。当需要从一个 World 切换到另一个 World 的时候（如点击“播放”按钮之后，UE 引擎从编辑器视图的 Preview World 切换到PIE World），FWorldContext 就会用来保存切换过程信息和目标 World 的上下文信息。

## GameInstance（UGameInstance）

如果继续从这种关系树往上层查找，我们可以找到用来保存 FWorldContext 对象和整个游戏信息的新类型——— UGameInstance。
UGameInstance 类型除了会保存 FWorldContext* WorldContext，还保存了当前游戏里所有的 Local Player、Game Session 等信息。
我们在切换 Level 的时候，其内的各种数据都会被释放然后重新生成，也就是说会丢失数据，哪怕是管理 Level 的 World 也是（只要切换Persistent Level，UWorld 都会被释放然后重新生成新 UWorld 再来存放 Persistent Level，从而造成数据丢失），因此 UGameInstance 就非常适合用于编写独立于所有 Level 和 World 之外的功能。