---
sidebar_position: 7
---

# Lambda 表达式
C++11 标准中引入了 Lambda 表达式，用于定义匿名函数，使得代码更加灵活简洁。

Lambda 表达式与普通函数类似，也有参数列表、返回值类型和函数体，只是它的定义方式更简洁，并且可以在函数内部定义。例如：
```cpp
auto plus = [] (int v1, int v2) -> int { return v1 + v2; }
int sum = plus(1, 2);
```
但是一般来说我们不会这么使用，更多的时候，都是和 STL 的一些算法结合使用，将 lambda 表达式作为一种函数对象传进去。例如：
```cpp
sort(vec.begin(), vec.end(), [](const int& a, const int& b) 
{
    return a > b;
});
```
这样的写法可以让代码更加简洁、清晰，可读性更强。
一般来说，lambda 的写法是：
```cpp
[captures](params){body}
```
- captures 捕获列表：lambda 可以把上下文变量以值或者引用的方式捕获，在 body 中直接使用
- params 参数列表：在C++ 14之后才允许使用auto 作为参数类型
- body 函数体：函数的具体逻辑

## 捕获列表
几种常见的捕获方式有：
- `[]` 什么也不捕获，无法在 lambda 函数体中使用任何上下文中的变量
- `[=]` 按值传递的方式捕获所有上下文中的变量
- `[&]` 按照引用传递的方式捕获所有上下文中的变量
- `[=, &a]` 除了变量 a 是引用传递以外，使用值传递的方式捕获其他的所有变量，后面可以跟多个 `&b, &c....`
- `[&, a]` 以值传递的方式捕获变量 a，使用引用传递的方式部或其他的所有变量
- `[a, &b]` 以值传递的方式捕获 a，以引用传递的方式捕获 b
- `[this]` 在成员函数中，也可以直接捕获 this 指针（其实在成员函数中，`[=]`和`[&]`也可以直接捕获 this 指针。捕获 this 指针，可以直接调用类中的成员，而不需要用 `this->`这样的操作

## 编译器如何处理 lambda 表达式

编译器会将 lambda 表达式翻译成一个类，并且通过重载 operator() 来实现函数调用。

```cpp
auto lambda = [&]() { cout << "hello!" << endl; return 0; };
	
cout << typeid(lambda).name() << endl;

// 输出为：
// class <lambda_91e1f7da3da1dbc8aa6d23953317ea83>
```

例如对如下这个简单的 lambda 表达式：
```cpp
auto plus = [] (int a, int b) -> int { return a + b; }
int c = plus(1, 2);
```
编译器会将其翻译为：
```cpp
class LambdaClass
{
public:
    int operator () (int a, int b) const
    {
        return a + b;
    }
};

LambdaClass plus;
int c = plus(1, 2);
```

而如果该 lambda 表达式中存在变量捕获，那么就会将捕获的变量作为类成员变量存起来，从而在函数体调用的时候可以正常使用。例如（注意按值捕获和按引用捕获是有区别的）：

1. 按值捕获

```cpp
int x = 1; int y = 2;
auto plus = [=] (int a, int b) -> int { return x + y + a + b; };
// auto plus = [=] (int a, int b) mutable -> int { x++; return x + y + a + b; };
int c = plus(1, 2);

// 翻译结果
class LambdaClass
{
public:
    LambdaClass(int xx, int yy)
    : x(xx), y(yy) {}

    // 运算符重载函数是const的，如果在函数内部要修改捕获的值，需要使用mutable关键字
    int operator () (int a, int b) const
    {
        return x + y + a + b;
    }

private:
    int x;
    int y;
}

int x = 1; int y = 2;
LambdaClass plus(x, y);
int c = plus(1, 2);
```

2. 按引用捕获

```cpp
int x = 1; int y = 2;
auto plus = [&] (int a, int b) -> int { x++; return x + y + a + b;};
int c = plus(1, 2);

// 翻译结果
class LambdaClass
{
public:
    LambdaClass(int& xx, int& yy)
    : x(xx), y(yy) {}

    int operator () (int a, int b)
    {
        x++;
        return x + y + a + b;
    }

private:
    int &x;
    int &y;
};
```

## 使用 lambda 表达式的注意事项
1. 注意捕获的参数的生命周期，例如当前使用`[&]`捕获的参数在另一个线程已经被释放掉了，但是 lambda 的函数体中仍然对其进行了读写
2. 引用捕获会导致闭包包含一个局部变量的引用或者一个形参的引用（在定义lamda的作用域）。如果一个由lambda创建的闭包的生命期超过了局部变量或者形参的生命期，那么闭包的引用将会空悬
3. 谨慎使用或者不用外部指针。如果你用值捕获了个指针，你在lambda创建的闭包中持有这个指针的拷贝，但你不能阻止lambda外面的代码删除指针指向的内容，从而导致你拷贝的指针空悬。
4. 避免使用默认捕获模式(即`[=]`或`[&]`,它可能导致你看不出悬空引用问题)