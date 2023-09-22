---
sidebar_position: 1
---
# [GPU Gems 3笔记] Part V: Physics Simulation

> 章节原文内容来自于：https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation

 物理模拟是一种高度数据并行化和计算密集型的任务，适合用于GPU计。另一方面，物理仿真计算得到的结果也会直接被GPU用于可视化，所以直接在GPU中进行计算，在graphics memory中生成结果也是很有意义的。

GPU Gems3关于物理模拟的章节和对应笔记：

- GPU上的实时刚体模拟：[笔记链接](./gems-5-1.md)
