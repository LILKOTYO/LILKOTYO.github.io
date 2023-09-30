---
sidebar_position: 8
---

# 自动类型推导
C++ 11 中引用了 auto 和 decltype 两个关键字实现了类型推导，让编译器来操心变量的类型。其中，auto 只能用来声明变量，而 decltype 则更加通用。

## auto 类型推导
auto 声明的变量必须被初始化，以使编译器能够从其初始化表达式中推导出其类型。从这个意义上来讲，auto 并非一种“类型”说明，而是一个类型声明时的“占位符”，编译器在编译时期会将 auto 替代为变量实际的类型。

auto 推导的最大优势是在拥有初始化表达式的复杂类型变量时简化代码，比如 STL 库的各种容器的迭代器。
例如 `vector<int>`的`begin()`返回的是`vector<int>::const_iteratior`类型，这个名字太长了，就可以直接用一个 auto 来代替。

### 推导规则
- 对于指针类型，声明为 auto、auto* 是没有区别的
- 声明引用类型，必须使用 auto &
- 不能得到推导变量的 const、volatile 属性
- auto不能用于函数传参
- auto还不能用于推导数组类型

其中，关于不能得到推导变量的 const、volatile 属性体现在：如果有一个函数返回的类型为 `const int`，如果直接用一个 auto 来接受的话，auto 会被推导为一个普通的 int。所以如果希望继承相关属性的话，需要自己显式声明，例如：
```cpp
const auto value = returnAConstInt();
```

auto 只是 C++ 11 类型推导的一部分，还有一部分应该使用 decltype 来体现。

## decltype
decltype 关键字是为了解决 auto 关键字只能对变量进行类型推导的缺陷而出现的。它的用法和 sizeof 很相似：
```cpp
decltype(表达式)
```
可以看到，他最主要的特点在于可以计算某个表达式的类型，例如：

```cpp
auto x = 1;
auto y = 2;
decltype(x+y) z;
```

### 推导规则
规则推导依次进行，满足任一条件就退出推导：
- 单个标记符，推导为T，例如 `int a; decltype(a) b;`，推导为`int`
- 右值引用，推导为T&&，例如`int a, decltype(move(a)) b;` 推导为`int&&`
- 非单个标记符的左值，推导为T&，例如
```cpp
double arr[5]
decltype(++a) aaa = a; // 两个标记 ++ 和 a，推导为 int &
decltype(arr[3]) arrv = 1.0; // 非单个标记，推导为 double &
decltype("Hello") h = "hello"; // 字符串字面值为左值，推导为 const char (&)[6]
```
- 不满足上面三个条件就推导为T

所以，对于 int i，编译器 decltype(i) 和 decltype((i)) 的编译结果不同，因为 i 是单个标记符，推导为 int；(i) 是标记符加小括号，不满足规则一，但满足规则三，推导为 int &。如果 decltype((i)) 没有给予左值 int 就会报错——左值引用未初始化。