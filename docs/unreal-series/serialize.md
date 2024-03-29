---
sidebar_position: 7
---

> 参考：[link](https://zhuanlan.zhihu.com/p/426853528)

# 序列化

为什么要做序列化？

我们的需求是要对游戏中某些核心逻辑的代码做一个快照，这个快照可以保存到磁盘，可以上传到服务器；拿到生成的快照还可以快速地恢复现场。

其实所谓的快照，不外乎就是对必要的对象做「序列化」。

序列化其实 UE4 的本身就写了一套。老祖宗 UObject 身上就有一个Serialize()方法，这个方法负责对整个类里面的「某些信息」做序列化。其中，被 UPROPERTY() 宏标记的属性，一般都是会被序列化的。

序列化到磁盘之后，UE 是将序列化的「二进制」数据以 `.uasset` 后缀的文件保存起来。使用 LoadObject 可以重新将 uasset 文件反序列化成 UObject。

