---
sidebar_position: 5
---
# C++ 新特性

## C++ 11
新特性包括：
- nullptr 替代 NULL引入了 
- auto 和 decltype 这两个关键字实现了类型推导
- 基于范围的 for 循环for(auto& i : res){}
- 类和结构体的中初始化列表
- Lambda 表达式（匿名函数）
- std::forward_list（单向链表）
- 右值引用和move语义

### C++ NULL 和 nullptr

NULL来自C语言，一般由宏定义实现，而 nullptr 则是C++11的新增关键字。在C语言中，NULL被定义为(void*)0，而在C++语言中，NULL则被定义为整数0。nullptr在C++11被引入用于解决这一问题，nullptr可以明确区分整型和指针类型，能够根据环境自动转换成相应的指针类型，但不会被转换为任何整型，所以不会造成参数传递错误。

### 智能指针
具体见文章：[智能指针](./smart_ptr.md)

### Lambda 表达式
具体见文章：[Lambda](./lambda.md)

### 右值引用和 move 语义
具体见文章：[右值](./rvalue_reference.md)