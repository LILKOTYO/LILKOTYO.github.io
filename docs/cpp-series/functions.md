---
sidebar_position: 11
---

# C++内置函数的机制记录

## sizeof
作用非常简单：求对象或者类型的大小（字节数）。其特性如下：
1. sizeof是运算符，不是函数；
2. sizeof不能求得void类型的长度；
```cpp
sizeof(void); //非法
```

3. sizeof能求得void类型的指针的长度；
4. 当表达式作为sizeof的操作数时，它返回表达式的计算结果的类型大小，但是它不对表达式求值
5. sizeof可以对函数调用求大小，并且求得的大小等于返回类型的大小，但是不执行函数体

```cpp
int function()
{
	cout << "call this function" << endl;
	return 1;
}
cout << sizeof(function()) << endl;
// 输出4，而不会输出"call this function"
```
6. 结构体或者类中的static成员变量不会被sizeof计算在内


## vector 的 resize 和 reserve
首先，reserve 的作用是更改 vector 的容量（capacity），使 vector 至少可以容纳 n 个元素。
- 如果 reserve(n) 的 n 大于当前 vector 容量，就会进行扩容；其他情况下都不会重新分配 vector 的存储空间
- reserve 是容器预留空间，但是在空间不创建元素对象，所以在没有添加新的对象之前，不能引用容器内的元素。加入新的元素需要用 push_back 等方法
- reserve 预分配的空间没有被初始化，所以不可访问

作用：与直接从 0 开始 push 元素，reserve 预分配空间后的 vector 不会频繁分配空间，所以在要 push 的元素很多的情况下可以带来效率提升。

resize 是改变容器的大小，并且创建对象
- resize(n) 会调整容器的大小（size），使其能够容纳 n 个元素，如果 n 小于容器当前的 size，则会删除多出来的元素
- resize(n, t) 将所有**新**添加的元素初始化为 t
- resize 是否会影响 vector 的容量（capacity），要看调整之后容器的 size 是否大于 capacity
- 由于创建了对象，所以 resize 后可以直接使用 operator[] 来引用元素对象

