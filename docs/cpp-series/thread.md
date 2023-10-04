---
sidebar_position: 12
---

# C++ 中的多线程

**进程**是一个应用程序被操作系统拉起来到加载到内存之后从开始执行到执行结束的这样一个过程。简单来说，进程是程序（应用程序、可执行文件）的一次执行。比如双击打开一个桌面应用软件就是开启了一个进程。

**线程**是进程中的一个实体，是被系统独立分配和调度的一个基本单位。

- 从属关系：进程>线程，一个进程可以拥有多个线程
- 每个线程共享同样的内存空间，开销比较小
- 每个进程拥有独立的内存空间，开销较大

为什么要是用多线程？
- 提高效率
- 无阻塞多任务

<center>

![multithread](img/multithread.png)

</center>

## 如何使用 std::thread

在C++11中，引入了线程库std::thread。它使用 std::thread 这个类来表示线程，这个类的构造函数的参数可以是任意的 lambda 表达式。在这个线程启动的时候，就会开始执行这个 lambda 里的内容。

```cpp
int main()
{
    thread t1([]() {
		for (int i = 0; i < 1e8; i++)
		{

		}
		cout << "ULAAAAAAAAAAAAA" << endl;
		});
    for (int j = 0; j < 2e8; j++)
    {
        if (j % (int)5e7 == 0)
            cout << "j is " << j << endl;
    }
    return 0;
}
```

在上面的代码中，可能存在这样一个问题：t1中的代码还没执行完，但是主线程上的代码跑完并且 return 退出了。主线程退出后，t1 这个子线程因为从属于这个主线程，也被迫退出了，任务也因此中断。

具体地，t1 作为一个变量在线程结束时被析构，而 std::thread 遵循 RAII 思想，因为管理着资源，它自定义了析构函数，删除了拷贝构造和拷贝赋值，但是提供了移动构造和移动赋值函数。因此，当 t1 的析构函数被调用时，就会销毁 t1 线程。

如果我们想要让主线程不要着急退出，等子线程执行完毕了再退出，那么就可以用 std::thread 的成员函数 join() 来等待该进程结束。

```cpp
....
t1.join();
return 0;
```

还有一个方案是，调用 std::thread 的成员函数 detach() 分离该线程，让该线程的生命周期不再由 std::thread 对象（即 t1）管理，而是在线程退出以后自动销毁自己。
不过这样还是会在进程退出的时候自动退出，所以不是完全保险。

所以一个较优的解法是，把线程对象移动到一个全局变量中去，在这个变量的析构函数中自动调用 join()：

```cpp
class ThreadPool {
private:
	vector<thread> m_pool;

public:
	void push_back(thread&& thr) {
		m_pool.push_back(thr);
	}

	~ThreadPool() {
		for (auto& t : m_pool)
			t.join();
	}
};
```

这个思路和 C++20 中引入的 std::jthread 类一致。

## 使用 std::async 来实现异步

std::async 可以用来比较方便的实现一个异步任务。std::async 接受一个带返回值的lambda，自身则返回一个 std::future 对象。lambda 中的函数体将会在另一个线程里面执行。

最后调用 std::future 的 get() 方法，获得 lambda 的返回值。如果此时 lambda 还没有执行完毕，那么就会等待至其执行完毕，然后获得返回值。

```cpp
future<int> f = async([&] {
    int ret = 0;
    for (int i = 0; i < 1000; i++)
        ret += i;
    return ret;
});

int val = f.get();
```

除了 get() 之外，还可以用 wait() 来进行等待，但是无法获得返回值。

std::async 的底层实现其实就是 std::thread 加上一个 std::promise。
如果不想让 std::async 帮你自动创建线程，想要手动创建线程，可以直接用 std::promise。
然后在线程返回的时候，用 set_value() 设置返回值。在主线程里，用 get_future() 获取其 std::future 对象，进一步 get() 可以等待并获取线程返回值。

```cpp
promise<int> pri;
thread t1([&] {
    auto ret = func();
    pri.set_value(ret);
    });

future<int> f = pri.get_future();
int value = f.get();

cout << value << endl;
t1.join();
```

## 互斥量
如果两个线程同时试图往一个数组里面堆数据，那就会出现程序崩溃的现象。这是因为 vector 不是多线程安全的容器，多个线程同时访问一个数据的时候会出现**数据竞争**（race condition）的现象。

### std::mutex
可以使用 std::mutex 对资源进行上锁：
```cpp
vector<int> arr;
mutex mtx;
thread t1([&] {
    for (int i = 0; i < 1000; i++) {
        mtx.lock();
        arr.push_back(1);
        mtx.unlock();
    }
});

thread t2([&] {
    for (int i = 0; i < 1000; i++) {
        mtx.lock();
        arr.push_back(2);
        mtx.unlock();
    }
});
t1.join();
t2.join();
```

调用 std::mutex 的 lock() 时，会检测 mutex 是否已经上锁：
- 如果没有锁定，就对 mutex 进行上锁
- 如果已经锁定，则陷入等待，直到 mutex 被另一个线程解锁后，才再次上锁

调用 std::mutex 的 unlock() 则会进行解锁操作。

通过上述机制，就可以保证 `mtx.lock()` 和 `mtx.unlock()` 之间的代码段在同一时间只有一个线程在执行，从而避免数据竞争。

不过 std::mutex 的 lock 在已经上锁的情况下会进行等待，从而阻塞线程，这样不是很好。
可以使用 try_lock()，它在上锁失败时不会陷入等待，而是直接返回 false；如果上锁成功，则会返回 true。


### std::lock_guard
前一种 std::mutex 类似于new得到的指针，需要程序员自己释放。使用 std::mutex 进行 lock 后，需要记得调用 unlock 来解锁，比较麻烦。
那么就可以用 std::lock_guard，它会在构造函数里调用 `mtx.lock()`，析构函数里会调用 `mtx.unlock()`，从而退出当前作用域时会自动解锁。

```cpp
vector<int> arr;
mutex mtx;
thread t1([&] {
    for (int i = 0; i < 1000; i++) {
        lock_guard grd(mtx);
        arr.push_back(1);
    }
});

thread t2([&] {
    for (int i = 0; i < 1000; i++) {
        lock_guard grd(mtx);
        arr.push_back(2);
    }
});
t1.join();
t2.join();
```

### std::unique_lock
std::lock_guard 会严格在析构的时候调用 unlock()，这样并不灵活，如果我们想要提前进行解锁的话，就可以使用 std::unique_lock。它额外存储了一个 flag 表示是否已经被释放。他会在析构检测这个 flag，如果没有释放，则调用 unlock()，否则不调用。

同样，在有需要的时候 std::unique_lock 还可以再次上锁，unique_lock 和 mutex 具有同样的接口：
```cpp
vector<int> arr;
mutex mtx;
thread t1([&] {
    for (int i = 0; i < 1000; i++) {
        unique_lock grd(mtx);
        arr.push_back(1);
    }
});

thread t2([&] {
    for (int i = 0; i < 1000; i++) {
        unique_lock grd(mtx);
        arr.push_back(2);
        grd.unlock();
        // grd.lock();
    }
});
t1.join();
t2.join();
```

### 死锁
由于两个线程的指令执行并不是同步的，所以可能出现如下情况：
```cpp
mutex mtx1;
mutex mtx2;

thread t1([&] {
    for (int i = 0; i < 1000; i++) {
        mtx1.lock();
        mtx2.lock();
        mtx1.unlock();
        mtx2.unlock();
    }
});

thread t2([&] {
    for (int i = 0; i < 1000; i++) {
        mtx2.lock();
        mtx1.lock();
        mtx1.unlock();
        mtx2.unlock();
    }
});

t1.join();
t2.join();
```
可能出现这个情况：
- t1 给 mtx1 上锁
- t2 给 mtx2 上锁
- t1 尝试给 mtx2 上锁，但是已经上锁了，于是开始等待
- t2 尝试给 mtx1 上锁，但是已经上锁了，于是开始等待
- 双方都在等待释放锁，开始无限制等待

这种现象就称为死锁。解决方案有：
- 最简单的是一个线程不要持有多个锁，但是有时候这是无法实现的
- 多个线程保证一样的上锁顺序
- 使用 `std::lock(mtx1, mtx2, ...)`一次性对多个 mutex 上锁，这个函数可以接受任意多个 mutex 作为参数，并且保证一定不会产生死锁问题，std::lock 需要手动解锁，使用 std::scoped_lock 可以实现自动解锁
  
### 另一个死锁例子
同一个线程重复调用 lock 也可以造成死锁，例如：
```
mutex mtx1;

void other() {
    mtx1.lock();
    // do something
    mtx1.unlock();
}

void func() {
    mtx1.lock();
    other();
    mtx1.unlock();
}
```

### 实现线程安全的 vector
可以通过 mutex 来给 vector 的写入和读取进行上锁，从而实现一个线程安全的 vector：
- 写入同时只能有一个人操作，所以要严格上锁
- 读取过程可以多人同时操作，所以不需要严格上锁

std::shared_mutex 可以实现上述两个功能：

```cpp
class MTVector {
private:
    std::vector<int> vec;
    std::shared_mutex mtx;

public:
    size_t size() {
        mtx.lock_shared();
        size_t ret = vec.size();
        mtx.unlock_shared();
        return ret;
    }

    void push_back(int val) {
        mtx.lock();
        vec.push_back(val);
        mtx.unlock();
    }
};
```

### 原子操作
原子（atom）本意是“不能被进一步分割的最小粒子”，而原子操作（atomic operation）意为"不可被中断的一个或一系列操作" 。

有两个方式来实现原子操作：
1. 使用 mutex 上锁来暴力上锁

```cpp
mtx.lock();
count += 1;
mtx.unlock();
```

问题：mutex 太过重量级，他会让线程被挂起，从而需要通过系统调用，进入内核层，调度到其他线程执行，有很大的开销。
可我们只是想要修改一个小小的 int 变量而已，用昂贵的 mutex 严重影响了效率。

2. 用更轻量级的 atomic

atomic 有专门的硬件指令加持，对它的 += 等操作，会被编译转换成专门的指令。

CPU 识别到该指令时，会锁住内存总线，放弃乱序执行等优化策略（将该指令视为一个同步点，强制同步掉之前所有的内存操作），从而向你保证该操作是原子 (atomic) 的（取其不可分割之意），不会加法加到一半另一个线程插一脚进来。
对于程序员，只需把 `int` 改成 `atomic<int>` 即可，也不必像 mutex 那样需要手动上锁解锁，因此用起来也更直观。

```cpp
std::atomic<int> counter = 0;

counter += 1;
```

这种做法有限制：
- count = count + 1 是不行的，不能保证原子性
- count += 1 可以保证原子性
- count++ 可以保证原子性

除了用方便的运算符重载之外，还可以直接调用相应的函数名fetch_add 