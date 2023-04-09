---
sidebar_position: 2
---
# 单文件CUDA程序的基本框架
单文件情况下，一个典型的CUDA程序的基本框架如下：
```cpp
// include headers
// define constant or macro
// C++ function and CUDA kernel function declare

int main() {
    // 1. Allocate memory (host and device)
    // 2. Initialize the data in the host
    // 3. Copy some data from host to device
    // 4. Call kernel function
    // 5. Copy some data from device to host
    // 6. Free memory (host and device)
}

// C++ function and CUDA kernel function define
```

