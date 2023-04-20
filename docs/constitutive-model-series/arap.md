---
sidebar_position: 1
---
# ARAP
> Sorkine, O. and M. Alexa (2007). As-rigid-as-possible surface modeling. In Eurog.
Symposium on Geometry processing, Volume 4.

ARAP（As-Rigid-As-Possible）的定义和弹簧质点模型中的能量非常相似，被称作是“Most-Spring-Mass-Like in F-based World”，具体如下所示：
$$
\Psi_{\text{ARAP}} =\frac{\mu}{2}||{\bf F}-{\bf R}||_F^2 
$$
其中的$\bf R$使用极分解得到。

:::tip 形变梯度的极分解
对于一个形变梯度$\bf F$，我们可以对其进行分解，得到一个正交矩阵$\bf R$和一个半正定矩阵$\bf S$：
$$
{\bf F} = {\bf R}{\bf S}
$$
其中正交矩阵$\bf R$是形变梯度中的旋转，$\bf S$则是其中的非旋转部分（缩放）。
:::

在具体实现中，可以使用svd分解来获得正交矩阵$\bf R$，然后计算ARAP的能量密度：
```cpp
REAL ARAP::psi(const MATRIX3 &U, const VECTOR3 &Sigma, const MATRIX3 &V) const {
    const MATRIX3 F = U * Sigma.asDiagonal() * V.transpose();
    // R = U * V.transpose()
    return 0.5 * _mu * (F - U * V.transpose()).squaredNorm();
}
```

## PK1 (First Piola-Kirchhoff Stress Tensor)
ARAP的能量密度对形变梯度的一阶偏导非常简单：
$$
P_{\text{ARAP}}(F) = \mu  ({\bf F}-{\bf R})
$$

## Hessian 
ARAP的能量密度及其对形变梯度的一阶偏导都比较简单，麻烦的是能量密度对形变梯度的二阶导（hessian），可以先尝试计算一下：
$$
\frac{\partial^2\Psi_{\text{ARAP}}}{\partial {\bf F}^2}=\frac{\partial P_{\text{ARAP}}}{\partial {\bf F}}=\mu\frac{\partial}{\partial {\bf F}}({\bf F}-{\bf R})=\mu(I-\frac{\partial{\bf R}}{\partial{\bf F}})
$$
这里面有一个正交矩阵$\bf R$对形变梯度的求导，对极分解这个过程求微分是十分困难的。在[Dynamic Deformables](http://www.tkim.graphics/DYNAMIC_DEFORMABLES/)中使用了一系列不变式（invariants）来表征形变中的某些属性，然后使用不变式构成了各个本构模型的能量密度，并给出了hessian的计算通式。基于这个计算通式，我们可以成功计算出ARAP的能量密度对形变梯度的二阶偏导：（如果你还不了解这一套基于不变式的计算方法，可以查看我的这一篇文档：[《不变式构造本构模型并计算Hessian》](https://lilkotyo.github.io/docs/tutorial-basics/create-a-document)
