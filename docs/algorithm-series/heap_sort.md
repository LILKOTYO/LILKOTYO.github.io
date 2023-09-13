---
sidebar_position: 1
---
# 堆排序
> 参考：
> 【排序算法：堆排序【图解+代码】】 https://www.bilibili.com/video/BV1fp4y1D7cj/?share_source=copy_web&vd_source=ee33f825ba0d9765eddc91a10101fa78

```cpp
#include <iostream>
#include <vector>

using namespace std;

// 交换数组中两个元素的位置
void swap(int& a, int& b) {
	int temp = a;
	a = b;
	b = temp;
}


// 维护堆的性质
// n: 数组长度
// i: 要维护的节点
void heapify(vector<int>& arr, int n, int i)
{
	int largest = i;
	int lson = 2 * i + 1;
	int rson = 2 * i + 2;

	if (lson < n && arr[lson] > arr[largest])
		largest = lson;
	if (rson < n && arr[rson] > arr[largest])
		largest = rson;

	if (largest != i)
	{
		swap(arr[largest], arr[i]);
		heapify(arr, n, largest);
	}
}

// 堆排序接口
void heapSort(vector<int>& arr)
{
	// 建堆
	int n = arr.size();
	for (int i = n / 2 - 1; i >= 0; i--)
	{
		// 从第一个最后一个非叶子节点开始，维护堆的性质
		heapify(arr, n, i);
	}

	// 堆排序
	while (n > 1)
	{
		swap(arr[0], arr[--n]);
		heapify(arr, n, 0);
	}

}

// 测试
int main() {
	vector<int> arr = { 7, 2, 1, 6, 8, 5, 3, 4 };
	heapSort(arr);
	cout << "排序结果：";
	for (int num : arr) {
		cout << num << " ";
	}
	cout << endl;

	return 0;
}
```