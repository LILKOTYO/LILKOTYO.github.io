---
sidebar_position: 1
---
# 多态和虚函数表
最近连续几次面试都问了这个问题，于是将其记录到博客中。

## 什么是多态
“多态”（polymorphism），是指计算机程序运行时，相同的消息可能会送给多个不同的类别之对象，而系统可依据对象所属类别，引发对应类别的方法，而有不同的行为。简单地来说，就是“在用父类指针调用函数时，实际调用的是指针指向的实际类型（子类）的成员函数”。多态性使得程序调用的函数是在运行时动态确定的，而不是在编译时静态确定的。

举例：
```cpp
class Base {
public:
    virtual void vir_func() { cout << "virtual function, this is base class!" << endl; }
    void func() { cout << "normal function, this is base class!" << endl; }
}

class A : public Base {
    virtual void vir_func() { cout << "virtual function, this is A class!" << endl; }
    void func() { cout << "normal function, this is A class!" << endl; }
}

class B : public Base {
    virtual void vir_func() { cout << "virtual function, this is B class!" << endl; }
    void func() { cout << "normal function, this is B class!" << endl; }
}

int main() {
    Base* base = new Base();
    Base* a = new A();
    Base* b = new B();
    base->func(); 
    a->func();
    b->func();
    cout << "========================================" << endl;
    base->vir_func();
    a->vir_func();
    b->vir_func();
}
```

代码运行的结果为：
```
normal function, this is base class!
normal function, this is base class!
normal function, this is base class!
========================================
virtual function, this is base class!
virtual function, this is A class!
virtual function, this is B class!
```

总结一下上面的规律：**当使用基类的指针调用成员函数的时候，普通函数由指针的类型来决定，虚函数由指针指向的实际类型决定**。这个功能是通过虚函数表来实现的。

## 虚函数表
解释虚函数表的原理之前，先介绍一下类的内存分布，对于一个不包含静态变量和虚函数的类：
```cpp
class noVir{
public:
    void func_a();
    void func_b();
    int var;
}
```
它的内存分布是这样的：

![noVirtualMemory](img/noVirtualClassMemory.png)

其中成员函数放在代码区，为该类的所有对象**公有**，即不管新建多少个该类的对象，所对应的都是同一个函数存储区的函数。而成员变量则为各个对象所**私有**，即每新建一个对象都会新建一块内存区用来存储var值。在调用成员函数时，程序会根据类的类型，找到对应代码区所对应的函数并进行调用。在文章开头的例子中，base、a、b都是Base类型的指针。调用普通函数时，程序根据指针的类型到类Base所对应的代码区找到所对应的函数，所以都调用了类Base的func函数，即指针的类型决定了普通函数的调用。

而带有虚函数的类的内存分布是这样的：
```cpp
class withVir{
public:
    void func_a();
    virtual void func_b();
    int var;
}
```
![virtualMemory](img/virtualClassMemory.jpg)

如果使用`sizeof(withVir)`可以发现，withVir类会比noVir类大四个字节，多出来的这部分内容就是指针`vptr`，该指针叫做**虚函数表指针**，它指向一个名为虚函数表（vtbl）的表。
虚函数表实际上一个数组，数组里面的每个元素都是一个函数指针。上例中，虚函数表里就存储了虚函数`func_b()`具体实现所对应的位置。

注意，普通函数、虚函数、虚函数表都是同一个类的所有对象公有的，只有成员变量和虚函数表指针是每个对象私有的，sizeof的值也**只包括**`vptr`和var所占内存的大小，并且`vptr`通常会在对象内存的最起始位置。

不论一个类中有多少个虚函数，类的实例中也只会有一个`vptr`指针，增多虚函数，变化的是该类所对应的虚函数表的长度，即其中所存储的指向虚函数的函数指针的数量。

那么可以总结出虚函数的实现原理：**通过对象内存中的vptr找到虚函数表vtbl，接着通过vtbl找到对应虚函数的实现区域并进行调用**。如开头例子中，当调用vir_func函数时，分别通过base、a、b指针找到对应的`vptr`，然后找到各自的虚函数表vtbl，最后通过vtbl找到各自虚函数的具体实现。所以虚函数的调用时由指针所指向内存块的具体类型决定的。

## 构造函数和析构函数可以是虚函数吗？
给出结论：**构造函数不能是虚函数，析构函数可以是、且推荐写为虚函数**。

为什么构造函数不能是虚函数？我们已经知道虚函数的实现则是通过对象内存中的`vptr`来实现的。而构造函数是用来实例化一个对象的，通俗来讲就是为对象内存中的值做初始化操作。那么在构造函数完成之前，`vptr`是没有值的，也就无法通过`vptr`找到作为虚函数的构造函数所在的代码区，所以构造函数只能作为普通函数存放在类所指定的代码区中。

为什么析构函数推荐最好设置为虚函数？如文章开头的例子中，当我们delete(a)的时候，如果析构函数不是虚函数，那么调用的将会是基类Base的析构函数。而当继承的时候，通常派生类会在基类的基础上定义自己的成员，基类的析构函数并不知道派生类中有什么新的成员，自然也无法将它们的内存释放，所以说析构函数会被推荐写为虚函数。