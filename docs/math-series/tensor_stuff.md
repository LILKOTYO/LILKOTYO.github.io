---
sidebar_position: 1
---

# 张量计算（以FEM中能量密度对位置求导为例）
> 本文主要参考自2021年的SIGGRAPH Course "Dynamic Deformables: Implementation and Production Practicalities"中的第三章"Computing Forces the Tensor Way"

在使用FEM的方法对弹性体进行模拟的时候，需要计算能量对位置的倒数取负数来获得力。此处定义能量密度为$\Psi\in\mathbb{R}$，形变梯度为${\bf F}\in\mathbb{R}^{3\times3}$，位置为${\bf x} \in \mathbb{R}^{12}$，那么能量密度对位置的偏导为：
$$
\frac{\partial \Psi}{\partial \bf x}=\frac{\partial \Psi}{\partial \bf F}\frac{\partial \bf F}{\partial \bf x}
$$

其中能量密度对形变梯度的偏导很好理解，其结果也是一个3x3的矩阵。
麻烦的是形变梯度对位置的偏导，即一个矩阵对向量的偏导。
形变梯度对位置中的每一个分量进行求导可以得到一个3x3的矩阵，那么完整的偏导就是12个3x3的矩阵的几何，这是一个三维张量，其维度为$\mathbb{R}^{3\times3\times12}$。
> 这里只展示了四个矩阵，实际上应该有12个
![3order](img/3ordertensor.png)

我们也可以将其视作一个由矩阵构成的向量，用我们更熟悉的二维的形式来表示三维张量：
> 这里只展示了四个矩阵，实际上应该有12个
![3order](img/3ordervector.png)

从张量计算的角度出发，之前的计算公式可以重写为：
$$
\frac{\partial \Psi}{\partial \bf x}=\frac{\partial \bf F}{\partial \bf x}：\frac{\partial \Psi}{\partial \bf F}
$$
这里的“：”代表张量缩并。

## 张量缩并（张量形式）
张量缩并是向量点积的推广，向量点积是：
$$
{\bf x}^T{\bf y}=
\begin{bmatrix}
x_0 \\ x_1 \\ x_2
\end{bmatrix}^T
\begin{bmatrix}
y_0 \\ y_1 \\ y_2
\end{bmatrix}=
x_0y_0+x_1y_1+x_2y_2
$$
矩阵缩并所做的事情也差不多：
$$
{\bf A}:{\bf B}=
\begin{bmatrix}
a_{00} & a_{01} \\
a_{10} & a_{11}
\end{bmatrix}:
\begin{bmatrix}
b_{00} & b_{01} \\
b_{10} & b_{11}
\end{bmatrix}=
a_{00}b_{00}+a_{01}b_{01}+a_{10}b_{10}+a_{11}b_{11}
$$
我们再进一步扩展到张量：
$$
{\bf A}:{\bf B}=
\begin{bmatrix}
\begin{bmatrix}
a_0 & a_1\\
a_2 & a_3
\end{bmatrix}\\
\\
\begin{bmatrix}
a_4 & a_5\\
a_6 & a_7
\end{bmatrix} \\
\\
\begin{bmatrix}
a_8 & a_9\\
a_{10} & a_{11}
\end{bmatrix}
\end{bmatrix}:
\begin{bmatrix}
b_{0} & b_{1} \\
b_{2} & b_{3}
\end{bmatrix}=
\begin{bmatrix}
a_0b_0+a_1b_1+a_2b_2+a_3b_3\\
a_4b_0+a_5b_1+a_6b_2+a_7b_3\\
a_8b_0+a_9b_1+a_{10}b_2+a_{11}b_3
\end{bmatrix}
$$
![contraction](img/contraction.png)

可能这样的计算方法对我们来说还不够容易接受，那么其实不论是几维的张量，我们都可以将其平坦化（flattened）或向量化（vectorized），然后我们就可以在熟悉的二维领域去进行计算了。

## 平坦化（flattened）
