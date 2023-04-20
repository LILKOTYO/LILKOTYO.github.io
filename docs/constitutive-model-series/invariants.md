---
sidebar_position: 1
---
# 不变式构造本构模型并计算Hessian

> Smith, B., F. D. Goes, and T. Kim (2019, February). Analytic eigensystems for isotropic
distortion energies. ACM Trans. Graph. 38(1).

:::tips 请确保对张量缩并有所了解

本构模型能量密度对位置的二阶导需要计算能量密度对形变梯度的二阶导$\frac{\partial^2\Psi}{\partial{\bf F}^2}$，这个量是一个$3\times3\times3\times3$的四维张量，所以请先确保你对张量的缩并有所了解。我的博客中给出了一个比较通俗的解释，通过一些平坦化的手段让物理模拟场景下的张量计算能够简化为矩阵和向量之间的计算，传送门:[张量计算](../math-series/tensor_stuff.md)

:::

