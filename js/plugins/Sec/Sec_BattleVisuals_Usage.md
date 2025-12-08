# Sec_BattleVisuals.js 使用说明文档

## 1. 插件简介

### 1.1 基本信息
- **插件名称**: 战斗视觉表现力增强包
- **目标引擎**: RPG Maker MZ
- **当前版本**: 2.8
- **作者**: Secmon
- **依赖插件**: Sec_BattleSystemInstance
- **功能**: 增强战斗视觉效果，提供各种战斗特效，如切入图、射线效果、识破红框、斩杀顿帧等

### 1.2 插件特点
- **接管 Sec_BattleSystemInstance 的视觉表现层**
- **射线自定义**：弹射和溅射的颜色、粗细、透明度均可独立设置
- **协战自定义**：支持镜头拉近倍率、切入图位置、缩放、裁剪高度和切入线自定义
- **识破自定义**：支持红框的透明度、粗细调整
- **斩杀自定义**：支持顿帧时长调整
- **多种视觉特效**：包括亡语幽灵、推条重压、拉条残影、状态碎裂等
- **可配置性强**：几乎所有特效都可以通过插件参数进行调整

## 2. 安装说明

### 2.1 安装步骤
1. 确保已经安装了依赖插件 `Sec_BattleSystemInstance.js`
2. 将 `Sec_BattleVisuals.js` 文件放入项目的 `js/plugins/Sec/` 目录中
3. 在 RPG Maker MZ 编辑器中打开插件管理界面
4. 点击「插件管理」按钮
5. 点击「添加」按钮，选择该插件
6. 确保该插件位于 `Sec_BattleSystemInstance.js` 之后
7. 调整插件优先级（建议放在其他战斗相关插件之后）
8. 点击「确定」保存设置

### 2.2 配置要求
- RPG Maker MZ 1.9.1 或更高版本
- 已安装依赖插件 `Sec_BattleSystemInstance.js`

## 3. 插件参数设置

### 3.1 通用设置

| 参数名称 | 描述 | 默认值 | 建议范围 |
|----------|------|--------|----------|
| HitStopDuration | 斩杀顿帧强度 | 12 | 5-30 |

### 3.2 协战设置

| 参数名称 | 描述 | 默认值 | 建议范围 |
|----------|------|--------|----------|
| SynergyZoomLevel | 镜头拉近倍率 | 1.30 | 1.00-2.00 |
| CutinScale | 切入图缩放 | 1.50 | 0.50-2.50 |
| CutinHeight | 切入图高度% | 20 | 5-100 |
| CutinTargetX | 切入图目标X | 300 | 100-500 |
| CutinOffsetY | 切入图Y偏移 | -100 | -200-200 |
| CutinBorderColor | 切入线颜色 | #FFFFFF | 任意HEX颜色 |
| CutinBorderThickness | 切入线粗细 | 2 | 1-10 |
| CutinBorderAlpha | 切入线透明度 | 0.50 | 0.00-1.00 |

### 3.3 识破设置

| 参数名称 | 描述 | 默认值 | 建议范围 |
|----------|------|--------|----------|
| ReactionBorderAlpha | 边框不透明度 | 180 | 0-255 |
| ReactionBorderSize | 边框宽度 | 20 | 5-50 |

### 3.4 弹射射线设置

| 参数名称 | 描述 | 默认值 | 建议范围 |
|----------|------|--------|----------|
| RicochetBeamColor | 射线颜色 | #00FFFF | 任意HEX颜色 |
| RicochetBeamWidth | 射线粗细 | 3 | 1-10 |
| RicochetBeamAlpha | 射线不透明度 | 1.00 | 0.00-1.00 |

### 3.5 溅射射线设置

| 参数名称 | 描述 | 默认值 | 建议范围 |
|----------|------|--------|----------|
| SplashBeamColor | 射线颜色 | #FF8800 | 任意HEX颜色 |
| SplashBeamWidth | 射线粗细 | 4 | 1-10 |
| SplashBeamAlpha | 射线不透明度 | 1.00 | 0.00-1.00 |

## 4. 功能模块说明

### 4.1 视觉管理器 (VisualManager)

视觉管理器是插件的核心部分，负责管理所有视觉特效的初始化、更新和触发。它提供了以下主要功能：

- **顿帧效果**：斩杀时的画面静止效果
- **镜头缩放**：协战时的镜头拉近效果
- **切入图**：角色眼部特写切入效果
- **射线效果**：弹射和溅射的连线效果
- **特效管理**：各种战斗特效的管理和触发

### 4.2 战斗特效

插件提供了多种战斗特效，以下是主要特效的说明：

#### 4.2.1 斩杀顿帧
- **触发条件**：当技能触发斩杀效果时
- **效果**：画面静止一段时间，配合颜色反转和屏幕震动
- **配置参数**：`HitStopDuration`（顿帧时长）

#### 4.2.2 协战切入图
- **触发条件**：队友进行协战时
- **效果**：显示角色眼部特写，配合装饰线
- **配置参数**：`CutinScale`、`CutinHeight`、`CutinTargetX`、`CutinOffsetY`、`CutinBorderColor`、`CutinBorderThickness`、`CutinBorderAlpha`

#### 4.2.3 识破红框
- **触发条件**：敌人识破玩家行动时
- **效果**：屏幕边缘显示红框
- **配置参数**：`ReactionBorderAlpha`、`ReactionBorderSize`

#### 4.2.4 射线效果
- **触发条件**：
  - 溅射伤害时触发溅射射线
  - 弹射伤害时触发弹射射线
- **效果**：显示从源目标到当前目标的连线
- **配置参数**：
  - 弹射射线：`RicochetBeamColor`、`RicochetBeamWidth`、`RicochetBeamAlpha`
  - 溅射射线：`SplashBeamColor`、`SplashBeamWidth`、`SplashBeamAlpha`

#### 4.2.5 亡语幽灵
- **触发条件**：单位死亡并触发亡语效果时
- **效果**：显示单位的幽灵形象，向上漂浮并逐渐消失

#### 4.2.6 推条重压
- **触发条件**：技能触发推条效果时
- **效果**：目标角色产生压缩变形效果

#### 4.2.7 拉条残影
- **触发条件**：技能触发拉条效果时
- **效果**：目标角色产生残影效果，显示移动轨迹

#### 4.2.8 状态碎裂
- **触发条件**：技能触发状态交互时
- **效果**：显示碎裂的图标效果

## 5. 视觉特效详解

### 5.1 特效触发条件

| 特效类型 | 触发条件 |
|----------|----------|
| synergy | 协战效果 |
| reaction | 识破效果 |
| exec | 斩杀效果 |
| splash | 溅射效果 |
| drain | 吸血效果 |
| ghost | 亡语效果 |
| push | 推条效果 |
| pull | 拉条效果 |
| state | 状态交互 |
| charge | 蓄力释放 |
| ricochet | 弹射效果 |

### 5.2 特效配置

所有特效都可以通过插件参数进行配置，主要配置项包括：

- **颜色**：特效的颜色
- **粗细/大小**：特效的粗细或大小
- **透明度**：特效的透明度
- **持续时间**：特效的持续时间
- **动画参数**：特效的动画效果参数

## 6. 配置示例

### 6.1 常规配置

**目标**：设置适中的视觉效果，不过于夸张

**配置参数**：
- HitStopDuration: 12
- SynergyZoomLevel: 1.30
- CutinScale: 1.50
- CutinHeight: 20
- CutinTargetX: 300
- CutinOffsetY: -100
- CutinBorderColor: #FFFFFF
- CutinBorderThickness: 2
- CutinBorderAlpha: 0.50
- ReactionBorderAlpha: 180
- ReactionBorderSize: 20
- RicochetBeamColor: #00FFFF
- RicochetBeamWidth: 3
- RicochetBeamAlpha: 1.00
- SplashBeamColor: #FF8800
- SplashBeamWidth: 4
- SplashBeamAlpha: 1.00

### 6.2 视觉强化配置

**目标**：强化视觉效果，适合动作游戏风格

**配置参数**：
- HitStopDuration: 20
- SynergyZoomLevel: 1.50
- CutinScale: 2.00
- CutinHeight: 25
- CutinTargetX: 400
- CutinOffsetY: -50
- CutinBorderColor: #FF0000
- CutinBorderThickness: 4
- CutinBorderAlpha: 0.80
- ReactionBorderAlpha: 220
- ReactionBorderSize: 30
- RicochetBeamColor: #00FF00
- RicochetBeamWidth: 5
- RicochetBeamAlpha: 1.00
- SplashBeamColor: #FF0000
- SplashBeamWidth: 6
- SplashBeamAlpha: 1.00

## 7. 常见问题

### 7.1 插件不生效
- 检查是否已经安装了依赖插件 `Sec_BattleSystemInstance.js`
- 检查插件顺序是否正确，`Sec_BattleVisuals.js` 必须在 `Sec_BattleSystemInstance.js` 之后
- 检查插件参数是否正确配置

### 7.2 切入图显示异常
- 检查角色的脸型图片是否存在
- 检查 `CutinHeight` 参数是否设置合理
- 检查 `CutinOffsetY` 参数是否设置合理

### 7.3 射线效果不显示
- 检查技能是否正确触发了溅射或弹射效果
- 检查射线相关参数是否正确配置
- 检查目标是否在视野范围内

### 7.4 性能问题
- 降低特效的持续时间
- 降低特效的透明度
- 减少同时触发的特效数量
- 降低 `CutinScale` 等影响渲染性能的参数

## 8. 更新日志

### v2.8 (Current)
- **[新增] 切入线自定义**：支持切入线颜色、粗细、透明度设置
- **[优化] 射线效果**：改进了射线的视觉效果
- **[修复] 切入图位置**：修复了切入图位置偏移的问题

### v2.7
- **[优化] 性能优化**：减少了不必要的渲染计算
- **[修复] 亡语幽灵**：修复了亡语幽灵显示异常的问题

### v2.6
- **[新增] 拉条残影**：新增拉条时的残影效果
- **[优化] 识破红框**：改进了识破红框的视觉效果

### v2.5
- **[新增] 推条重压**：新增推条时的重压效果
- **[新增] 状态碎裂**：新增状态交互时的碎裂效果

### v2.0
- **[重构] 视觉管理器**：重构了视觉管理器，提高了可维护性
- **[新增] 多种特效**：新增了多种战斗特效
- **[优化] 配置界面**：优化了插件参数配置界面

---

**文档更新时间**: 2025-12-04
**文档版本**: 2.8