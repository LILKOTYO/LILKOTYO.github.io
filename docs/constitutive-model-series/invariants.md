---
sidebar_position: 1
---
# 不变式构造本构模型并计算Hessian

> Smith, B., F. D. Goes, and T. Kim (2019, February). Analytic eigensystems for isotropic
distortion energies. ACM Trans. Graph. 38(1).

:::tips 请确保对张量缩并有所了解

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
其中${\bf g}_i=\operatorname{vec}\left(\frac{\partial I_i}{\partial {\bf F}}\right)$，${\bf H}_i=\operatorname{vec}\left(\frac{\partial^2 I_i}{\partial {\bf F}^2}\right)$。首先我们先来看看平坦化的$I_2,I_3$的Hessian，$I_1$的Hessian计算比较麻烦，所以最后再讲：
$$
\begin{aligned}
    \operatorname{vec}\left(\frac{\partial^2I_2}{\partial {\bf F}^2}\right)&=\operatorname{vec}\left(\frac{\partial 2{\bf F}}{\partial {\bf F}}\right)=
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
\end{bmatrix}=2{\bf I}
\end{aligned}
$$