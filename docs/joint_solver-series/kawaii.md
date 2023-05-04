---
sidebar_position: 2
---
# Kawaii Joint Solver

> Kawaii的网址：[link](https://github.com/pafuhana1213/KawaiiPhysics)

本文中的Kawaii Joint Solver为上一章节[Joint Solver 整体框架](./joint_base.md)中提到的类（我们将其命名为JointSolverBase）的子类。
```cpp
class KawaiiJointSolver : public JointSolverVase { ... }
```

Kawaii本质上是一种利用父关节带动子关节运动的一种dynamics，结果会叠加在原动画上。

## 成员变量

首先我们可以先将Kawaii求解过程中需要的骨骼节点数据打包成一个结构体，方便后面的讲解：
```cpp
struct KawaiiBoneData {
    int                 boneIndex = -1;
    int                 parentIndex = -1;
    VECTOR3             location;
    VECTOR3             preLocation;
    VECTOR3             poseLocation;
    KawaiiJointAttr*    jointAttr;
}
```

其中需要注意，其中的`location`和`preLocation`指的是仿真得到的数据，`poseLocation`是动画的数据。要注意区分**仿真**和**动画**。
然后`jointAttr`是一个指向Kawaii求解器所管理的所有joint的相关属性，这些属性一般是由用户设定的，我们使用`jointAttr`这个指针来访问它。他一般包括下面这些内容：
```cpp
struct KawaiiJointAttr {
    float damping;
    float worldLocDamping;
    float worldRotDamping;
    float stiffness;
    float airflowDamping;
    float limitAngle;
}
```

`KawaiiJointSolver`的成员变量包括：
```cpp
    array<KawaiiBoneData>   _kawaiiBones;
    VECTOR3                 _compMoveVector;
    QUAT                    _compMoveRotation;
    Transform               _preCompTransform;
    float                   _exponent;
    float                   _teleportDisThreshold; // 根节点的位移上限
    float                   _teleportRotThreshold; // 根节点的旋转上限
    float                   _windSpeed;
    VECTOR3                 _windDirection;
    VECTOR3                 _gravity;

    // 基类中的成员变量：
    // vector<VECTOR3> _jointPositions;
    // vector<QUAT>    _jointRotations;
    // int             _subStep;
    // float           _deltaT;
    // float           _alpha;
    // DataInterface*  _dataInterface;
```

## 成员函数
为了更好的实现功能，Kawaii求解器中定义了一些功能函数，我们首先对它们进行一些介绍。之后再来看看基类中的虚函数是怎么被实现的。

### 初始化骨骼节点的数据    InitBoneData()
之前我们将所有的骨骼节点的数据都封装进了一个结构体`KawaiiBoneData`中，所以首先我们当然需要对其进行一次初始化。
```cpp
for (int jointIndex = 0; jointIndex < JointNumber; jointIndex++) {
    int parentIndex = _dataInterface->GetJointParent(jointIndex);
    KawaiiBoneData newBone;
    newBone.boneIndex = jointIndex;
    Transform boneTransform = _dataInterface->GetJointTransform(jointIndex);
    newBone.location = boneTransform.GetLocation();
    newBone.poseLocation = newBone.location;
    newBone.preLocation = newBone.location;
    newBone.jointAttr = (KawaiiJointAttr*)_dataInterface->GetJointAttr(jointIndex);
    if (parentIndex < 0) {
        // 如果不存在父节点
        newBone.parentIndex = -1;
    } else {
        newBone.parentIndex = parentIndex;
    }
    _kawaiiBones.add(newBone);
}
```

### 修正根节点过大的位移和旋转 UpdateMovement(Transform& transform)
为了让整个模型更加稳定，我们会人为约束两帧之间根节点的位移和旋转，这个约束的阈值就是成员变量中的`_teleportDisThreshold`和`_teleportRotThreshold`。
函数的输入`transform`就是当前根节点的运动信息，用于和`_preCompTransform`进行比对来找到两帧之间的位移和旋转，`_preCompTransform`的初始化在函数`Init()`中。

:::tip 怎么找到相对的位移和旋转？

知道节点在某个坐标系下，两帧的旋转和位移之后，怎么计算得到两帧之间相对的旋转和位移？后一帧的位移/旋转叠加上前一帧的位移/旋转的逆运动即可。

:::

```cpp
void UpdateMovement(Transform& transform) {
    // InverseTransformPosition 叠加逆位移运动
    _compMoveVector = transform.InverseTransformPosition(_preCompTransform.getLocation());
    if (_compMoveVector.Squared() > _teleportDisThreshold * _teleportDisThreshold) {
        _compMoveVector = VECTOR3(0.0, 0.0, 0.0);
    }
    // InverseTransformRotation 叠加逆旋转运动
    _compMoveRotation = transform.InverseTransformRotation(_preCompTransform.getRotation());
    if (_compMoveRotation.GetAngle() > _compMoveRotation * _compMoveRotation) {
        _compMoveRotation = QUAT::Identity;
    }
    // 更新_preCompTransform
    // TODO 为什么不用_compMoveVector和_compMoveRotation构成新的_preCompTransform？
    _preCompTransform = transform;
}
```

### 计算惯性和风力  UpdatePose()
如标题所示，计算惯性和风力并更新，有点类似于XPBD在求解约束之前，要先进行一次$x=x+vt$。
```cpp
for (int jointIndex = 0; jointIndex < JointNumber; jointIndex++) {
    // 首先先将对应骨骼的数据取出来，由于我们是要对数据进行更新的，所以需要用引用
    auto& bone = _kawaiiBones[jointIndex];
    // 获取动画数据和仿真数据
    bone.poseLocation = _dataInterface->GetJointTransform(bone.boneIndex);
    bone.location = _dataInterface->GetJointSimTransform(bone.boneIndex);

    if (bone.parentIndex < 0) {
        // 如果没有父节点，那就让其直接跟随用户k帧的动画
        bone.preLocation = bone.location;
        bone.location = bone.poseLocation;
        continue;
    }

    // 更新风力和damping的作用
    VECTOR3 velocity = (bone.location - bone.preLocation) / _deltaT;
    bone.preLocation = bone.location;
    velocity *= (1.0f - bone.jointAttr->damping);
    
    VECTOR3 windVelocity = _windSpeed * _windDirection;
    velocity += windVelocity;

    bone.location += velocity * _deltaT;

    // 跟随根节点进行运动
    bone.location += _compMoveVector * (1.0 - bone.jointAttr->worldLocDamping);
    bone.location += (_compMoveRotation.RotateVector(bone.preLocation)-bone.preLocation) * (1.0 - bone.jointAttr->worldRotDamping);

    // 重力
    bone.location += 0.5 * _gravity * _deltaT * _deltaT;
}
```

### 约束仿真结果和动画之间的角度 AdjustAngle(...)
有时候动画师并不希望使用纯仿真的结果，他们希望动画的一切效果还是以自己k出来的为主，仿真只是锦上添花，所以说我们需要将仿真计算出来的结果进行约束。
```cpp
void AdjustAngle(float limitAngle, VECTOR3& location, VECTOR3& parentLocation, VECTOR3 poseLocation, VECTOR3 parentPoseLocation) {
    VECTOR3 boneDir = (location - parentLocation).Normalized();
    VECTOR3 poseDir = (poseLocation - parentPoseLocation).Normalized();
    VECTOR3 axis = VECTOR3::CrossProduct(poseDir, boneDir);
    float angle = Atan2(axis.Length(), VECTOR3::DotProduct(poseDir, boneDir));
    float angleOverLimit = angle - limitAngle;

    if (angleOverLimit > 0.0f) {
        // 将多余的部分转回去
        boneDir = boneDir.RotateAngleAxis(_angleOverLimit, axis);
        location = boneDir * (location - parentLocation).Length() + parentLocation;
    }
}
```

接下来就是基类原有框架下的重写部分了。
### 初始化 `Init()`
除开基类已有的功能外，Kawaii的初始化中的额外工作就是将所有骨骼节点数据调用`InitBoneData()`进行初始化。
```cpp
JointSolverBase::Init();
_kawaiiBones.Empty(); // 先清空
if (_kawaiiBones.Num() == 0) {
    InitBoneData();
    _preCompTransform = _dataInterface->GetComponentTransform();
}
```

### 隐式求解 `SolveImpl()`
Kawaii的隐式求解的过程大致如下：
- 首先获取当前的根节点的位移和旋转，如果过大就将其修正
- 应用惯性、重力和风力
- 将仿真结果叠加到动画效果上

```cpp
void SolveImpl() {
    Transform componentTransform = _dataInterface->GetComponentTransform();
    UpdateMovement(componentTransform);
    UpdatePose();

    int chainNumber = _dataInterface->GetChainNumber();
    for (int chainIndex = 0; chainIndex < chainNumber; chainIndex++) {
        int chainLength = _dataInterface->GetChainLength(chainIndex);
        for (int chainNodeIndex = 0; chainNodeIndex < chainLength; chainNodeIndex++) {
            int jointIndex = _dataInterface->GetChainNodeIndex(chainIndex, chainNodeIndex); 
            // 首先先将对应骨骼的数据取出来，由于我们是要对数据进行更新的，所以需要用引用
            auto& bone = _kawaiiBones[jointIndex];
            if (bone.parentIndex < 0) 
                continue;

            auto& parentBone = _kawaiiBones[bone.parentIndex];
            VECTOR3 poseLocation = bone.poseLocation;
            VECTOR3 parentPoseLocation = parentBone.poseLocation;

            // 如果没有仿真，本节点应该在的位置
            VECTOR3 idealLocation = parentBone.location + (poseLocation - parentPoseLocation);
            // 根据关节的刚性进行位置修正
            bone.location += (idealLocation - bone.location) * (1.0 - pow(1.0 - bone.jointAttr->stiffness, _exponent));

            // 修正角度
            AdjustAngle(bone.jointAttr->limitAngle, 
                bone.location, parentBone.location,
                bone.poseLocation, parentBone.poseLocation);

            // 恢复长度
            float boneLength = (poseLocation - parentPoseLocation).Length();
            bone.location = (bone.location - parentBone.location).Normalized() * boneLength + parentBone.location;
        }
    }
}
```

### 为约束和碰撞求解做准备 `PrepareSubStep()`
在基类的方法中，对碰撞体的transform进行了插值，这里我们还需要对我们定义的骨骼节点数据进行插值：
```cpp
virtual void PrepareSubStep() {
    JointSolverBase::PrepareSubStep();
    for (int jointIndex = 0; jointIndex < JointNumber; jointIndex++) {
        auto* bone = &_kawaiiBones[jointIndex];
        VECTOR3 targetLocation = bone->location;
        VECTOR3 preLocation = bone->preLocation;
        VECTOR3 dir = (targetLocation - preLocation) / (float)_subStep;
        _jointPositions[jointIndex] += dir;
    }
}
```

### 求解约束 `SolveConstrains()`
在约束求解以后，还需要对角度进行一次约束。
```cpp
void SolveConstrains() {
    JointSolverBase::SolveConstrains();
    int chainNumber = _dataInterface->GetChainNumber();
    for (int chainIndex = 0; chainIndex < chainNumber; chainIndex++) {
        int chainLength = _dataInterface->GetChainLength(chainIndex);
        for (int chainNodeIndex = 0; chainNodeIndex < chainLength; chainNodeIndex++) {
            int jointIndex = _dataInterface->GetChainNodeIndex(chainIndex, chainNodeIndex); 
            auto& bone = _kawaiiBones[jointIndex];
            if (bone.parentIndex < 0)
                continue;
            int parentIndex = bone.parentIndex;
            auto& parentBone = _kawaiiBones[parentIndex];
            AdjustAngle(bone.jointAttr->limitAngle, 
            _jointPositions[jointIndex], _jointPositions[parentIndex],
            bone.poseLocation, parentBone.poseLocation);
        }
    }
}
```

基于上述所有内容，将对应的函数套用到JointSolverBase的求解框架中去，就可以使用Kawaii Joint Solver进行求解了。