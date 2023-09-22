---
sidebar_position: 3
---
# 归并排序
>参考：【排序算法：归并排序【图解+代码】】 https://www.bilibili.com/video/BV1Pt4y197VZ/?share_source=copy_web&vd_source=ee33f825ba0d9765eddc91a10101fa78

```cpp
// 合并
void merge(vector<int>& arr, vector<int>& tempArr, int low, int mid, int high)
{
	// 标记左右半区第一个未排序的元素
	// 临时数组的下标
	int lPtr = low;
	int rPtr = mid + 1;
	int p = low;

	// 合并
	while (lPtr <= mid && rPtr <= high)
	{
		if (arr[lPtr] < arr[rPtr])
			tempArr[p++] = arr[lPtr++];
		else
			tempArr[p++] = arr[rPtr++];
	}

	// 合并左半区剩余的元素
	while (lPtr <= mid)
		tempArr[p++] = arr[lPtr++];

	// 合并右半区剩余的元素
	while (rPtr <= high)
		tempArr[p++] = arr[rPtr++];

	// 把临时数组中合并后的元素复制粘贴到原数组中
	for (int i = low; i <= high; i++)
	{
		arr[i] = tempArr[i];
	}
}

void mergeSort(vector<int>& arr, vector<int>& tempArr, int low, int high)
{
	// 只有一个元素就不划分
	if (low < high)
	{
		int mid = (low + high) / 2;
		// 递归划分
		mergeSort(arr, tempArr, low, mid);
		mergeSort(arr, tempArr, mid + 1, high);
		// 合并左右半区
		merge(arr, tempArr, low, mid, high);
	}
}

void mergeSort(vector<int>& arr)
{
	int size = arr.size();
	vector<int> tempArr(size);
	mergeSort(arr, tempArr, 0, size - 1);
}

// 测试
int main() {
	vector<int> arr = { 5,1,1,2,0,0 };
	mergeSort(arr);
	return 0;
}
```

