---
sidebar_position: 10
---

# 类型转换
类型转换是将一个数据类型的值转换为另一种数据类型的值。

C++ 中有四种类型转换：静态转换、动态转换、常量转换和重新解释转换。

## 静态转换（Static Cast）
静态转换是将一种数据类型的值强制转换为另一种数据类型的值。

静态转换通常用于比较类型相似的对象之间的转换，例如将 int 类型转换为 float 类型。

静态转换不进行任何运行时类型检查，因此可能会导致运行时错误。

```cpp
int i = 10;
float f = static_cast<float>(i); // 静态将int类型转换为float类型
```

在多态情况下，将派生类指针或引用向上转换为基类的时候是安全的。
## 动态转换（Dynamic Cast）
动态转换通常用于将一个基类指针或引用转换为派生类指针或引用（向下转换）。动态转换在运行时进行类型检查，如果不能进行转换则返回空指针或引发异常。

```cpp
class Base {};
class Derived : public Base {};
Base* ptr_base = new Derived;
Derived* ptr_derived = dynamic_cast<Derived*>(ptr_base); // 将基类指针转换为派生类指针
```

## 常量转换（Const Cast）
常量转换用于将 const 类型的对象转换为非 const 类型的对象。

常量转换只能用于转换掉 const 属性，不能改变对象的类型。
```cpp
const int i = 10;
int& r = const_cast<int&>(i); // 常量转换，将const int转换为int
```

## 重新解释转换（Reinterpret Cast）
重新解释转换将一个数据类型的值重新解释为另一个数据类型的值，通常用于在不同的数据类型之间进行转换。

重新解释转换不进行任何类型检查，因此可能会导致未定义的行为。
```cpp
int i = 10;
float f = reinterpret_cast<float&>(i); // 重新解释将int类型转换为float类型
```