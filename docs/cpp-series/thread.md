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

std::astnc 的底层实现其实就是 std::thread 加上一个 std::promise。
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