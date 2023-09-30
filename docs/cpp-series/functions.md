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