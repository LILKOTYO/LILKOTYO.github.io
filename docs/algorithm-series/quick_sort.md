---
sidebar_position: 2
---
# 快排
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

// 分割数组并返回分割点的索引
int partition(vector<int>& arr, int low, int high) {
	int pivot = arr[high];	// 数组最后一位为基准值
	int smallRightBound = low - 1;  // 小于基准值的区域的有边界，初始时认为没有任何值小于基准值，所以边界是-1

	for (int i = low; i < high; ++i)
	{
		if (arr[i] < pivot)
		{
			++smallRightBound;
			swap(arr[smallRightBound], arr[i]); // 将小于基准值的值swap到右边界
		}
	}
	swap(arr[smallRightBound + 1], arr[high]);  // 将基准值放到右边界的右侧
	return smallRightBound + 1;
}

// 快速排序的递归函数
void quickSort(vector<int>& arr, int low, int high) {
	if (low < high)  // 退出条件
	{
		int pivot = partition(arr, low, high);
		quickSort(arr, pivot + 1, high);
		quickSort(arr, low, pivot - 1);
	}
}

// 快速排序的接口函数
void quickSort(vector<int>& arr) {
	int size = arr.size();
	quickSort(arr, 0, size - 1);
}

// 测试
int main() {
	vector<int> arr = { 7, 2, 1, 6, 8, 5, 3, 4 };
	quickSort(arr);

	cout << "排序结果：";
	for (int num : arr) {
		cout << num << " ";
	}
	cout << endl;

	return 0;
}
```