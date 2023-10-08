---
sidebar_position: 2
---
# 左右值、左右值引用和移动构造
>参考资料：https://www.zhihu.com/question/363686723/answer/2590214399

现代C++把表达式分为三种主要的类型，每一个C++表达式都可以被分为**左值**和右值，其中右值又分为**纯右值**和**将亡值**。

## 左右值
### 左值
左值不能简单理解为就是等号左边的值，**只要能够取地址，那这个表达式就是左值**，也就是说程序的某块内存地址已经分配给了这个表达式。一些常见的左值：
- 具名的变量名：`int a;`的`a`
- 左值引用：`int&`
- 右值引用：`int&&`
- 返回左值引用的 函数或者操作符重载 的调用语句
- 内置的赋值表达式：`a=b`，`a+=b`
- 前缀自增：`++a`, `--a`
- 字符串常量
- 左值引用的类型转换语句：`static_cast<int&>(x)`

`int a = 1;`中的数字常量1不是左值，1是一个立即数，它没有地址，知识在寄存器中作临时运算。

左值不一定能赋值（例如字符串常量），左值一定能取地址。

### 纯右值

右值是临时产生的值，不能对右值取地址，因为它本身就没存在内存地址空间上。一些常见的纯右值：
- 除字符串以外的常量：`1`, `true`, `nullptr`
- 返回非引用的函数或操作符重载的调用语句
- 后缀自增：`a++`, `a--`
- 运算表达式：`a+b`, `a<<b`
- 对变量取地址的表达式：`&a`
- this指针
- lambda表达式

### 将亡值
将亡值，顾名思义，就是即将销毁的东西。主要分两种：
- 返回**右值引用**的函数或者操作符重载的调用表达式：例如某个函数的返回值是`std::move(x)`，并且函数的返回类型是`typename&&`
- 目标为**右值引用**的类型转换表达式：`static_cast<int&&>(a)`

## 左右值引用
### 左值引用
左值引用很常见，主要分为：非const左值引用和const左值引用。其中，非const左值引用只能绑定左值，const左值引用既可以绑定左值，也可以绑定右值。
```cpp
int a = 1;
int& lref = a;
lref ++; // 通过非 const 左值引用可以修改其值
const int& lref_const = a;
// lref_const_a++; // error, const左值引用不能修改其值

const int& lref_const_rvalue = 999;  // const 左值引用可以直接绑定右值 999 
cout << "lref_const_rvalue = " << lref_const_rvalue;
```

### 右值引用
右值引用只能够绑定到右值上。如下：
```cpp
int b = 2;
// int&& rref_b = b; // error,右值引用只能绑定到右值上，b是一个左值
int&& rref = 2; // ok
cout << "rref=" << rref << endl;  // 输出 2
rref++;
cout << "rref=" << rref << endl;  // 输出 3
```

### move语义
如果有一个左值，我们是否可以将其转化为右值呢？可以，使用**move**语义。
move这个词看上去像是做了资源的移动，但是没有，move其实就是一个类型转换。如 cppreference 所说：
> In particular, std::move produces an xvalue expression that identifies its argument t. It is exactly equivalent to a static_cast to an rvalue reference type.

`move(x)`产生一个将亡值(xvalue)表达式来标识其参数`x`。他就完全等同于 `static_cast<T&&>(x)`。所以说，move 并不作任何的资源转移操作。单纯的`move(x)`不会有任何的性能提升，不会有任何的资源转移。它的作用仅仅是产生一个标识x的右值表达式。因为它会返回一个右值，所以可以和一个右值引用进行绑定：
```cpp
int a = 2;
int&& rref = std::move(a);
```

### 它们有什么用？
到这里，可能会发现右值引用以及 move 好像都也没什么用，凸显不出它跟左值引用有什么特殊点。其实他们主要用在函数参数里面，下面是一个cppreference的例子：
```cpp
void f(int& x)
{
    std::cout << "lvalue reference overload f(" << x << ")\n";
}

void f(const int& x)
{
    std::cout << "lvalue reference to const overload f(" << x << ")\n";
}

void f(int&& x)
{
    std::cout << "rvalue reference overload f(" << x << ")\n";
}

int main()
{
    int i = 1;
    const int ci = 2;
    f(i);  // calls f(int&)
    f(ci); // calls f(const int&)
    f(3);  // calls f(int&&)
           // would call f(const int&) if f(int&&) overload wasn't provided
    f(std::move(i)); // calls f(int&&)

    // rvalue reference variables are lvalues when used in expressions
    int&& x = 1;
    f(x);            // calls f(int& x)
    f(std::move(x)); // calls f(int&& x)
}
```
当函数参数既有左值引用重载，又有右值引用重载的时候，我们得到重载规则如下：
- 若传入参数是非const左值，调用非const左值引用重载函数
- 若传入参数是const左值，调用const左值引用重载函数
- 若传入参数是右值，调用右值引用重载函数(即使是有 const 左值引用重载的情况下)
因此，`f(3)`和`f(std::move(i))`会调用`f(int&&)`,因为他们提供的入参都是右值。

所以，通过 move 语义 和 右值引用的配合，我们能提供右值引用的重载函数。这给我们一个机会，一个可以利用右值的机会。特别是对于 xvalue（将亡值）来说，他们都是即将销毁的资源，如果我们能最大程度利用这些资源的话，这显然会极大的增加效率、节省空间。

## 移动构造函数
之前提到，单纯的 move 不会带来任何资源转移，那么要怎么实现转移函数呢？
考虑一个简单的string类，提供了构造函数和拷贝构造函数：
```cpp
class string {
  string(const char* a, length) {
    m_length = length;
    m_ptr = malloc(m_length);
    memcpy(a, m_ptr, length);
  }

  string(const string& b) {
    m_length = b.m_length;
    m_ptr = malloc(m_length);
    memcpy(m_ptr, b.m_ptr, b.length);
  }

  char* m_ptr;
  int m_length;
};
```
注意，由于类中使用了指针`m_ptr`，所以在拷贝构造函数里面要使用`深拷贝`，即重新申请内存空间，并将其内存数据用memcpy拷贝过来。

如果我们在程序中需要构建一个存储了这个 string 类的数组，可能需要这么做：
```cpp
vector<string> list;
string a("hello world", 11);
// 这里会调用拷贝构造函数, 将 a 对象拷贝一份，vector 再把这个副本添加到 vector 中
list.push_back(a);
```
加入到数组后，`a`这个对象就没有用了，那么我们希望能够把`a`对象的资源移动，而不是重新拷贝一份，这样的话相比能够提高效率。有两个问题：
- `push_back` 函数如何通过入参来区分对象是应该拷贝资源还是应该移动资源
- 如何用已有的 string 对象通过资源转移构造出另一个 string，而不是调用拷贝构造函数

关于问题一，事实上我们知道右值可以用来标识对象即将要销毁，所以只要能够区分参数是右值还是左值就可以知道用移动还是构造了。根据之前提到的重载规则，我们需要为`push_back`提供右值引用的重载，从而右值会优先调用到右值引用参数的函数。
```cpp
void push_back(string&& v) {
    // ...
}
```
那么要如何产生右值来调用重载的函数呢？使用 move 语义就可以，`std::move(a)`会产生一个将亡值。

接下来思考问题二，我们使用右值引用作为参数来重载构造函数来解决该问题：
```cpp
string(string&& b) {
    m_length = b.m_length;
    m_ptr = b.m_ptr;
    b.m_ptr = nullptr;
}
```
这个函数就叫做**移动构造函数**。它的参数是右值引用，并且从实现中可以看到，并没有像拷贝构造函数那样重新调用 malloc 申请资源，而是直接用了另一个对象的堆上的资源。也就是在移动构造函数中，才真正完成了资源的转移。根据前面左右引用函数重载的规则，要想调用移动构造函数，那么必须传入参数为右值才行。使用 move 可以将左值转换为右值：
```cpp
string a("hello world", 11);
list.push_back(std::move(a));
```
事实上，STL中的 vector 容器已经提供了右值引用的`push_back`重载，不需要我们来自己实现。

### 什么时候需要实现移动构造函数？
对比之前给出的移动构造函数和拷贝构造函数，可以发现它们大多数地方都是相同的复制操作。其实，只要是栈上的资源，都是采用复制的方式，只有**堆上的资源，才能够复用旧的对象的资源**。

为什么栈上的资源不能复用，而要重新复制一份？因为你不知道旧的对象何时析构，旧的对象一旦析构，其栈上所占用的资源也会完全被销毁掉，新的对象如果复用的这些资源就会产生崩溃。

为什么堆上的资源可以复用？因为堆上的资源不会自动释放，除非你手动去释放资源。可以看到，在移动构造函数特意将旧对象的`m_ptr`指针置为 null，就是为了预防外面对其进行 delete 释放资源。

所以说，只有当你的类申请到了堆上的内存资源的时候，才需要专门实现移动构造函数，否则其实没有必要，因为他的消耗跟拷贝构造函数是一模一样的。