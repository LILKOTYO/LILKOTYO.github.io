---
sidebar_position: 1
---
# 不变式构造本构模型并计算Hessian

> 参考论文：Smith, B., F. D. Goes, and T. Kim (2019, February). Analytic eigensystems for isotropic
distortion energies. ACM Trans. Graph. 38(1).

:::tip 请确保对张量缩并有所了解

本构模型能量密度对位置的二阶导需要计算能量密度对形变梯度的二阶导$\frac{\partial^2\Psi}{\partial{\bf F}^2}$，这个量是一个$3\times3\times3\times3$的四维张量，所以请先确保你对张量的缩并有所了解。我的博客中给出了一个比较通俗的解释，通过一些平坦化的手段让物理模拟场景下的张量计算能够简化为矩阵和向量之间的计算，传送门：[张量计算](../math-series/tensor_stuff.md)。

:::

## 什么是不变式（invariants）？
不变式和应变的感觉有一些像，就是一系列用来正确表征形变的物理量，那么什么东西不会带来形变呢？是平移和旋转，所以不变式就是能够在平移和旋转的时候保持不变的，由形变梯度构成的式子。

下面给出论文中所提出的三个不变式：
$$
I_1=\operatorname*{tr}({\bf S}) \qquad I_2=\operatorname{tr}({\bf S}^2)\qquad I_3=\operatorname{det}(F)=\operatorname{det}({\bf RS})=\operatorname{det}({\bf R})\operatorname{det}({\bf S})=\operatorname{det}({\bf S})
$$

目前已知的大量本构模型的能量密度函数都可以用三个不变式进行构建，例如：
### ARAP
$$
\begin{aligned}
    \Psi_{\text{ARAP}}&=||{\bf F}-{\bf R}||^2_F\\
    &=||{\bf F}||^2_F-2\operatorname{tr}({\bf F}^T{\bf R})+||{\bf R}||^2_F\\
\end{aligned}
$$
因为有：
- $||{\bf F}||_F^2=\sum_i\sum_jF_{ij}^2=\operatorname{tr}({\bf F}^T{\bf F})=\operatorname{tr}({\bf S}^T{\bf R}^T{\bf R}{\bf S})=\operatorname{tr}({\bf S}^2)$（$\bf S$为对称阵）
- $||{\bf R}||_F^2=\operatorname{tr}({\bf RR}^T)=\operatorname{tr}({\bf I})=3$

所以：
$$
\begin{aligned}
    \Psi_{\text{ARAP}}&=||{\bf F}||^2_F-2\operatorname{tr}({\bf F}^T{\bf R})+||{\bf R}||^2_F\\
    &=\operatorname{tr}({\bf S}^2)-2\operatorname{tr}({\bf S})+3\\
    &=I_2-2I_1+3
\end{aligned}
$$

###  Bonet and Wood (2008)-style Neo-Hookean
> Bonet, J. and R. D. Wood (2008). Nonlinear continuum mechanics for finite element analysis. Cambridge university press.

$$
\Psi_{NHBW}=\frac{\mu}{2}(||{\bf F}||_F^2-3)-\mu\operatorname{log}(J)+\frac{\lambda}{2}(\operatorname{log}(J))^2
$$
其中$J$即为$\operatorname{det}(F)$，从而有：
$$
\Psi_{NHBW}=\frac{\mu}{2}(I_2-3)-\mu\operatorname{log}(I_3)+\frac{\lambda}{2}(\operatorname{log}(I_3))^2
$$

其他能量的不变式表示请见本系列的其他文章。

## 不变式的梯度
我们用不变式来表示能量密度的主要目的就是为了简化能量密度的梯度和Hessian（**相对形变梯度**，本文中在没有注明的情况下所提到的梯度和Hessian，都是相对于形变梯度，而非位置！）的计算，对任意可以用不变式来表示的能量，他们的梯度具有这样一个通式：

:::tip

根据[The Matrix Cookbook](https://www.math.uwaterloo.ca/~hwolkowi/matrixcookbook.pdf)，$\frac{\partial \operatorname{tr}({\bf AX}^T)}
{\partial {\bf X}}={\bf A}$

:::

$$
\frac{\partial \Psi}{\partial {\bf F}}=\frac{\partial \Psi}{\partial I_1}\frac{\partial I_1}{\partial {\bf F}}+\frac{\partial \Psi}{\partial I_2}\frac{\partial I_2}{\partial {\bf F}}+\frac{\partial \Psi}{\partial I_3}\frac{\partial I_3}{\partial {\bf F}}
$$
其中$\frac{\partial \Psi}{\partial I_i}$的计算非常简单，就是单纯的标量求导，高中知识就能算。接下来要计算的就是$\frac{\partial I_i}{\partial {\bf F}}$，接下来分别计算一下：
$$
\begin{aligned}
    \frac{\partial I_1}{\partial {\bf F}}=\frac{\operatorname*{tr}({\bf S})}{\partial {\bf F}}=\frac{\partial \operatorname{tr}({\bf RF}^T)}{\partial {\bf F}}={\bf R}\\
    \frac{\partial I_2}{\partial {\bf F}}=\frac{\partial \operatorname{tr}({\bf S}^2)}{\partial {\bf F}}=\frac{\partial ||{\bf F}||_F^2}{\partial {\bf F}}=2{\bf F}
\end{aligned}
$$
$I_3$的梯度计算会稍微麻烦一些，这里给出结论（TODO 找到一个好一点的参考材料）：
在三维空间中，形变梯度$\bf F$可以表示为：
$$
{\bf F}=\left[
    \begin{array}{c|c|c}
        {\bf f}_0 & {\bf f}_1 & {\bf f}_2
    \end{array}
\right]
$$
那么有：
$$
\frac{\partial I_3}{\partial {\bf F}}=\frac{\partial J}{\partial {\bf F}}=
\left[
    \begin{array}{c|c|c}
        {\bf f}_1\times{\bf f}_2 & {\bf f}_2\times{\bf f}_0 & {\bf f}_0\times{\bf f}_1
    \end{array}
\right]
$$

## 不变式的Hessian
与梯度类似，使用不变式构造的能量密度的Hessian同样也具有一个计算通式，不同的是，此处的Hessian它是一个$3\times3\times3\times3$的四维张量，我们需要将其“平坦化”为一个矩阵后，再使用下面这个公式去计算能量密度相对于**位置**的[Hessian](../math-series/tensor_stuff.md)：
$$
\frac{\partial^2\Psi}{\partial {\bf x}^2} = \text{vec}\left(\frac{\partial {\bf F}}{\partial {\bf x}}\right)^T\text{vec}\left(\frac{\partial^2 \Psi}{\partial {\bf F}^2}\right)\text{vec}\left(\frac{\partial {\bf F}}{\partial {\bf x}}\right)
$$
中间那一项就是平坦化后的不变式的Hessian，其计算通式为：
$$
\begin{aligned}
    \operatorname{vec}\left(\frac{\partial^2 \Psi}{\partial {\bf F}^2}\right)&=\frac{\partial^2\Psi}{\partial I_1^2}{\bf g}_1{\bf g}_1^T+\frac{\partial \Psi}{\partial I_1}{\bf H}_1+\frac{\partial^2\Psi}{\partial I_2^2}{\bf g}_2{\bf g}_2^T+\frac{\partial \Psi}{\partial I_2}{\bf H}_2+\frac{\partial^2\Psi}{\partial I_3^2}{\bf g}_3{\bf g}_3^T+\frac{\partial \Psi}{\partial I_3}{\bf H}_3\\
    &=\sum_{i=1}^3\frac{\partial^2\Psi}{\partial I_i^2}{\bf g}_i{\bf g}_i^T+\frac{\partial \Psi}{\partial I_i}{\bf H}_i
\end{aligned}
$$
其中${\bf g}_i=\operatorname{vec}\left(\frac{\partial I_i}{\partial {\bf F}}\right)$，${\bf H}_i=\operatorname{vec}\left(\frac{\partial^2 I_i}{\partial {\bf F}^2}\right)$。首先我们先来看看平坦化的$I_2,I_3$的Hessian，$I_1$的Hessian计算比较麻烦，所以最后再讲，首先是$I_2$：
$$
\begin{aligned}
    {\bf H}_2&=\operatorname{vec}\left(\frac{\partial 2{\bf F}}{\partial {\bf F}}\right)=
2\operatorname{vec}\left(
    \begin{bmatrix}
        \begin{bmatrix}1&0&0\\0&0&0\\0&0&0\end{bmatrix}&\begin{bmatrix}0&1&0\\0&0&0\\0&0&0\end{bmatrix}&\begin{bmatrix}0&0&1\\0&0&0\\0&0&0\end{bmatrix}\\\\
        \begin{bmatrix}0&0&0\\1&0&0\\0&0&0\end{bmatrix}&\begin{bmatrix}0&0&0\\0&1&0\\0&0&0\end{bmatrix}&\begin{bmatrix}0&0&0\\0&0&1\\0&0&0\end{bmatrix}\\\\
        \begin{bmatrix}0&0&0\\0&0&0\\1&0&0\end{bmatrix}&\begin{bmatrix}0&0&0\\0&0&0\\0&1&0\end{bmatrix}&\begin{bmatrix}0&0&0\\0&0&0\\0&0&1\end{bmatrix}
    \end{bmatrix}
\right)\\
&=2\operatorname{vec}\left(
    \begin{bmatrix}
        [{\bf dF}_0]&[{\bf dF}_1]&[{\bf dF}_2]\\\\
        [{\bf dF}_3]&[{\bf dF}_4]&[{\bf dF}_5]\\\\
        [{\bf dF}_6]&[{\bf dF}_7]&[{\bf dF}_8]
    \end{bmatrix}
\right)\\
&=2\begin{bmatrix}
    \operatorname{vec}\left([{\bf dF}_0]\right) & \operatorname{vec}\left([{\bf dF}_3]\right) & \operatorname{vec}\left([{\bf dF}_6]\right)& \cdots& \operatorname{vec}\left([{\bf dF}_0]\right)& \operatorname{vec}\left([{\bf dF}_0]\right)& \operatorname{vec}\left([{\bf dF}_0]\right)
\end{bmatrix}\\
&=2\begin{bmatrix}
    1&0&0&0&0&0&0&0&0\\
    0&1&0&0&0&0&0&0&0\\
    0&0&1&0&0&0&0&0&0\\
    0&0&0&1&0&0&0&0&0\\
    0&0&0&0&1&0&0&0&0\\
    0&0&0&0&0&1&0&0&0\\
    0&0&0&0&0&0&1&0&0\\
    0&0&0&0&0&0&0&1&0\\
    0&0&0&0&0&0&0&0&1\\
\end{bmatrix}=2{\bf I}_{9\times9}
\end{aligned}
$$
$I_3$也直接给出结论：

首先我们定义一个$\hat{\quad}$算子，它能够将一个向量转化为这样的矩阵：
$$
\hat{\bf x}=\begin{bmatrix}
    0&-x_2&x_1\\
    x_2&0&-x_0\\
    -x_1&x_0&0
\end{bmatrix}
$$
那么有：
$$
{\bf H}_3=\begin{bmatrix}
    {\bf 0}_{3\times3} & -\hat{\bf f}_2 & \hat{\bf f}_1\\
    \hat{\bf f}_2 & {\bf 0}_{3\times3} & -\hat{\bf f}_0\\
    -\hat{\bf f}_1 & \hat{\bf f}_0 & {\bf 0}_{3\times3}
\end{bmatrix}
$$

OK，接下来看看$I_1$的Hessian，为什么说他很难计算呢？根据前文已经了解到了$I_1$的梯度即极分解后得到的正交矩阵${\bf R}$，那么其Hessian显而易见，就是$\frac{\partial {\bf R}}{\partial {\bf F}}$。问题就是出在这里，我们并不知道这个正交矩阵相对形变梯度的偏导是什么。在本篇参考的论文中，通过构造旋转梯度$\frac{\partial {\bf R}}{\partial {\bf F}}$这个四维张量的特征值系统来解决这个问题。

### 旋转梯度的特征值系统表征
矩阵的特征值系统具备这样的特征：
$$
{\bf Aq}_0=\lambda_0{\bf q}_0
$$
类似的，对于下面这个四维张量
$$
{\bf A} = \begin{bmatrix}
    \begin{bmatrix}
        a_0 & a_1\\
        a_2 & a_3
    \end{bmatrix} &
    \begin{bmatrix}
        a_4 & a_5\\
        a_6 & a_7
    \end{bmatrix} \\ \\
    \begin{bmatrix}
        a_8 & a_9\\
        a_{10} & a_{11}
    \end{bmatrix} &
    \begin{bmatrix}
        a_{12} & a_{13}\\
        a_{14} & a_{15}
    \end{bmatrix}
\end{bmatrix}
$$
也存在一个特征值$\lambda_0$和特征矩阵${\bf Q}_0$使得：
$$
{\bf A}:{\bf Q}_0=\lambda_0{\bf Q}_0
$$
将这个过程平坦化：
$$
(\operatorname{vec}{\bf A})^T(\operatorname{vec}{\bf Q}_0)=\lambda_0\operatorname{vec}{\bf Q}_0
$$
那我们要怎么找到四维张量$\frac{\partial {\bf R}}{\partial {\bf F}}$的特征值和特征矩阵呢？论文中发现，如果形变梯度的奇异值分解的结果为：
$$
{\bf F}={\bf U\Sigma V}^T\qquad {\bf \Sigma}=\begin{bmatrix}
    \sigma_x & 0 & 0\\
    0 & \sigma_y & 0\\
    0 & 0 & \sigma_z
\end{bmatrix}
$$
那么$\frac{\partial {\bf R}}{\partial {\bf F}}$的特征值系统为：
$$
\begin{aligned}
    &\lambda_0=\frac{2}{\sigma_x+\sigma_y} \qquad {\bf Q}_0=\frac{1}{\sqrt{2}}{\bf U}\begin{bmatrix}
        0 & -1 & 0\\
        1 & 0 & 0\\
        0 & 0 & 0
    \end{bmatrix}{\bf V}^T\\
    &\lambda_1=\frac{2}{\sigma_y+\sigma_z} \qquad {\bf Q}_0=\frac{1}{\sqrt{2}}{\bf U}\begin{bmatrix}
        0 & 0 & 0\\
        0 & 0 & 1\\
        0 & -1 & 0
    \end{bmatrix}{\bf V}^T\\
    &\lambda_2=\frac{2}{\sigma_x+\sigma_z} \qquad {\bf Q}_0=\frac{1}{\sqrt{2}}{\bf U}\begin{bmatrix}
        0 & 0 & 1\\
        0 & 0 & 0\\
        -1 & 0 & 0
    \end{bmatrix}{\bf V}^T\\
    &\lambda_{3...8}=0 \qquad {\bf Q}_{3...8}=\text{subspace orthogonal to }{\bf Q}_{0,1,2}
\end{aligned}
$$
那么根据特征值系统的性质就可以得到：
$$
\operatorname{vec}\left(\frac{\partial {\bf R}}{\partial {\bf F}}\right)=
\sum_{i=0}^2\lambda_i\operatorname{vec}({\bf Q}_i)\operatorname{vec}({\bf Q}_i)^T
$$

## 结论
基于上述内容，可以给出本构模型的计算通用方法如下：

$$
\begin{aligned}
    &{\bf g}_1=\operatorname{vec}({\bf R})  &{\bf H}_1=\sum_{i=0}^2\lambda_i\operatorname{vec}({\bf Q}_i)\operatorname{vec}({\bf Q}_i)^T\\
    &{\bf g}_2=\operatorname{vec}(2{\bf F}) &{\bf H}_2=2{\bf I}_{9\times9}\\
    &{\bf g}_3=\left[
    \begin{array}{c|c|c}
        {\bf f}_1\times{\bf f}_2 & {\bf f}_2\times{\bf f}_0 & {\bf f}_0\times{\bf f}_1
    \end{array}
\right] &{\bf H}_3=\begin{bmatrix}
    {\bf 0}_{3\times3} & -\hat{\bf f}_2 & \hat{\bf f}_1\\
    \hat{\bf f}_2 & {\bf 0}_{3\times3} & -\hat{\bf f}_0\\
    -\hat{\bf f}_1 & \hat{\bf f}_0 & {\bf 0}_{3\times3}
\end{bmatrix}
\end{aligned}
$$

1. 使用不变式$I_1, I_2$和$I_3$来重写能量密度函数$\Psi$
2. 计算能量密度函数相对不变量的标量导数：$\frac{\partial \Psi}{\partial I_1}$，$\frac{\partial^2\Psi}{\partial I_1^2}$，$\frac{\partial \Psi}{\partial I_2}$，$\frac{\partial^2\Psi}{\partial I_2^2}$， $\frac{\partial \Psi}{\partial I_3}$ 和 $\frac{\partial^2\Psi}{\partial I_3^2}$
3. 使用下面两个通式来计算能量密度的和Hessian：
    $$\operatorname{vec}\left(\frac{\partial^2 \Psi}{\partial {\bf F}^2}\right)=\sum_{i=1}^3\frac{\partial^2\Psi}{\partial I_i^2}{\bf g}_i{\bf g}_i^T+\frac{\partial \Psi}{\partial I_i}{\bf H}_i$$
