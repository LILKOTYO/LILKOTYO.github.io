---
sidebar_position: 3
---
# 骨骼动画

> 参考资料：
> 
> UE4/UE5 动画的原理和性能优化：[link](https://zhuanlan.zhihu.com/p/545596818)

## 骨骼动画的思想
一个Mesh想要动起来，那么就需要去对每个顶点做Transform(位移/旋转/缩放)，那么每一帧都存这么多Transform，1秒24帧（或更多），一整段动画要存很多数据量，所以就有了骨骼这个概念。

骨骼这个概念，本质上就是压缩相同顶点的Transform的一种方式。具体来说，就是把Mesh上一部分的顶点和其中一个或多个骨骼做绑定，那么我们只要记录这个骨骼的Transform就好了。Mesh上的顶点会有对应骨骼的weight，每一帧只要将对应的骨骼的Transform做一个加权求和就能够得到该顶点的Transform。

所以整个动画分成两个阶段：
1. 现在**游戏线程**中的`TickComponent`里面求得当前帧的Pose（Pose：每个骨骼的Transform）
2. 在**渲染线程**中根据最终Pose做CPUSkin或GPUSkin算出顶点信息，并进行绘制

先骨骼，后render mesh（skinned mesh）。

:::tip TickComponent

TickComponent是UActorComponent类的成员函数，该函数会在每一帧被调用，以计算对应的组件在这一帧中的行为。

:::

## Game Thread

![Game Thread](img/1-gamethread.jpg)

