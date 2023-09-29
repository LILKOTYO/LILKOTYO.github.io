---
sidebar_position: 6
---
# 智能指针
智能指针就是帮我们C++程序员管理动态分配的内存的，它会帮助我们自动释放new出来的内存，从而避免内存泄漏。智能指针一共有四种，其中 auto_ptr 为 C++ 98 提出，其余的三者是在C++ 11 提出的。
- unique_ptr
- shared_ptr
- weak_ptr
- auto_ptr

## auto_ptr
auto_ptr 是c++ 98定义的智能指针模板，其定义了管理指针的对象，可以将new 获得（直接或间接）的地址赋给这种对象。当对象过期时，其析构函数将使用delete 来释放内存。

C++11 后auto_ptr 已经被“抛弃”，已使用unique_ptr替代！C++11后不建议使用auto_ptr。为什么呢？主要是一下几个原因：
1. 复制或者赋值都会改变资源的所有权

根据源码，auto_ptr 的拷贝是这样的：
```cpp
auto_ptr(auto_ptr& _Right) noexcept : _Myptr(_Right.release()) {}

_Ty* release() noexcept {
        _Ty* _Tmp = _Myptr;
        _Myptr    = nullptr;
        return _Tmp;
    }
```
假设有两个 auto_ptr p1 和 p2， 如果使用`p1 = p2` 进行赋值之后，p2 所管理的资源就会被释放掉。

2. 不支持数组的内存管理

```cpp
// 这样写是非法的
auto_ptr<int[]> array(new int[5]); 
```

所以，C++11用更严谨的unique_ptr 取代了auto_ptr！

## unique_ptr
unique_ptr 的功能和 auto_ptr 大致相同，但是做了一些设计让它更加安全和符合直觉：
1. 无法进行进行左值拷贝操作，允许临时右值拷贝构造和拷贝

```cpp
unique_ptr<int> p1(new int(1));
unique_ptr<int> p2(new int(2));

p1 = p2; // 这样是非法的，禁止拷贝
unique<int> p3(p2); // 这样是非法的，禁止拷贝构造

// 在程序员清楚风险的情况下，通过移动语义去调用移动构造和移动赋值
unique<int> p3(move(p2));
p1 = move(p2);
```
2. 支持数组的内存管理

下面这种用法是合法的了
```cpp
// 会自动调用delete [] 函数去释放内存
unique_ptr<int[]> array(new int[5]);
```

除了离开作用域自动释放以外，还可以主动进行释放，有以下几种方式：
```cpp
unique_ptr<int> p(new int(1));
p = NULL;
p = nullptr;
p.reset();
```

还可以放弃对象的控制权（资源不释放）：
```cpp
int* np = p.release();
```

auto_ptr 和 unique_ptr 都具有排他性，即一个资源只能被一个 auto_ptr/unique_ptr 管理，如果需要多个指针管理一个资源，就需要 shared_ptr。

## shared_ptr
shared_ptr 为了支持多个指针管理同一份资源，维护了一份记录引用特定内存对象的智能指针数量的引用计数，当复制或者拷贝的时候，引用计数加1，当智能指针析构的时候，引用计数减1，如果计数为0，那就释放该资源。

我们可以使用一个普通指针或者另一个 shared_ptr 来初始化一个 shared_ptr。
```cpp
shared_ptr<int> up1(new int(10));  // int(10) 的引用计数为1
shared_ptr<int> up2(up1);  // 使用智能指针up1构造up2, 此时int(10) 引用计数为2
```

另外还可以使用 make_shared 来初始化，这样的分配内存效率更高，推荐使用。make_shared 函数的主要功能是在动态内存中分配一个对象并初始化它，返回指向此对象的 shared_ptr。
```cpp
shared_ptr<int> up3 = make_shared<int>(2); // 多个参数以逗号','隔开，最多接受十个
shared_ptr<string> up4 = make_shared<string>("字符串");
shared_ptr<Person> up5 = make_shared<Person>(9);
```

shared_ptr 的移动构造：
```cpp
shared_ptr<int> p1 = make_shared<int>(1);
shared_ptr<int> p2(move(p1));

cout << p2.use_count() << endl; // 1
cout << p1.use_count() << endl; // 0
cout << p1.get() << endl; // nullptr
```

使用 shared_ptr 的过程中可能出现循环引用的问题：
```cpp
class B;
class A {
public:
    shared_ptr<B> ptr;
};

class B {
public:
    shared_ptr<A> ptr;
};

int main()
{
    shared_ptr<A> a = make_shared<A>(); // 引用计数为1
    shared_ptr<B> b = make_shared<B>(); // 引用计数为1
    a->ptr = b; // 引用计数为2
    b->ptr = a; // 引用计数为2
    cout << a->ptr.use_count() << endl; // 2
    cout << b->ptr.use_count() << endl; // 2
}
```
在析构过程中，对程序中实际生成的 A 和 B 的实例，都有 a、b->ptr 和 b、a->ptr 指向它们，程序运行结束的时候，a 和 b 被释放掉，可是实例中仍然有一个 shared_ptr 指向彼此，所以资源实际上并不会被正确释放掉。这个问题可以使用 weak_ptr 来解决。

可以发现，上面的代码中我们删掉 `a->ptr = b` 或者 `b->ptr = a` 中的任意一行都可以解决这个问题，weak_ptr 就是这样的工作原理。

## weak_ptr
weak_ptr 设计的目的是为配合 shared_ptr 而引入的一种智能指针来协助 shared_ptr 工作, 它**只可以从一个 shared_ptr 或另一个 weak_ptr 对象构造**, 它的构造和析构不会引起引用记数的增加或减少。 同时weak_ptr 没有重载 `*` 和 `->` 但可以使用 lock 获得一个可用的 shared_ptr 对象，从而来获得数据。

```cpp
weak_ptr wpGirl_1; // 定义空的弱指针

weak_ptr wpGirl_2(spGirl); // 使用共享指针构造

wpGirl_1 = spGirl; // 允许共享指针赋值给弱指针
```

weak_ptr 也可以获得引用计数：
```cpp
wpGirl_1.use_count();
```

在需要访问数据的时候可以通过 `lock()` 方法获得 shared_ptr，使用后记得将获得的 shared_ptr 释放掉就好：

```cpp
shared_ptr<Girl> sp_girl;
sp_girl = wpGirl_1.lock();

// 使用完之后，再将共享指针置NULL即可
sp_girl = NULL;
```
## 为什么智能指针可以像普通指针那样使用？
因为智能指针里面重载了 `*` 和 `->` 运算符。

## 智能指针使用tips
1. 不要把一个原生指针给多个智能指针管理，因为资源可能会被某个智能指针擅自释放掉了。（这个和多个 shared_ptr 管理一个资源不一样，如果需要多个智能指针来管理一个资源，请用 shared_ptr 的拷贝或者构造）
2. 禁止 delete 智能指针 get 函数返回的指针，如果我们主动释放掉get 函数获得的指针，那么智能 指针内部的指针就变成野指针了，析构时造成重复释放，带来严重后果!
3. 禁止用任何类型智能指针 get 函数返回的指针去初始化另外一个智能指针


## 自己写一个 shared_ptr !
要点主要是，使用指针来存储引用计数，从而就能够让sharedPtr共享同一个引用计数。
```cpp
class SharedPtr {
public:
    SharedPtr(int* p) : ptr(p), refCount(new int(1)) {}

    SharedPtr(const SharedPtr& other) : ptr(other.ptr), refCount(other.refCount) {
        (*refCount)++;
    }

    SharedPtr(SharedPtr&& other) {
        ptr = other.ptr;
        other.ptr = nullptr;
        refCount = other.refCount;
        other.refCount = nullptr;
    }

    ~SharedPtr() {
        (*refCount)--;
        if (*refCount == 0) {
            delete ptr;
            delete refCount;
        }
    }

    SharedPtr& operator=(const SharedPtr& other) {
        if (this == &other) {
            return *this;
        }

        (*refCount)--;
        if (*refCount == 0) {
            delete ptr;
            delete refCount;
        }

        ptr = other.ptr;
        refCount = other.refCount;
        (*refCount)++;

        return *this;
    }

    int* get() const {
        return ptr;
    }

    int& operator*() const {
        return *ptr;
    }

    int* operator->() const {
        return ptr;
    }

    int* ptr;
    int* refCount;
};
```