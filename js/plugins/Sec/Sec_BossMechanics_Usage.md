# Sec_BossMechanics.js 使用说明

## 插件概述

Sec_BossMechanics.js (v2.0 终极版) 是一个专为实现复杂Boss机制设计的工具箱，整合了召唤、时间回溯、条件技能和脚本执行等功能。该插件基于 Sec_BattleSystemInstance 开发，为Boss战提供了丰富的机制扩展。

### 核心功能

| 模块 | 功能描述 |
|------|----------|
| 召唤系统 (Summon) | 支持唯一召唤和强制召唤，可指定动画效果 |
| 状态亡语 (Trigger) | 状态消失时触发特定技能，用于实现钻地突袭等效果 |
| 条件技能 (Condition) | 根据场上敌人情况动态切换技能 |
| 快照系统 (Snapshot) | 记录和恢复HP/MP/TP，实现时间回溯效果 |
| 脚本特效 (Custom) | 执行自定义JS代码，实现复杂逻辑 |
| 种族光环 (Tribe) | 根据场上种族情况提升属性，实现暗黑体质等效果 |

## 依赖关系

- **基础插件**：Sec_BattleSystemInstance.js
- **加载顺序**：在 Sec_BattleSystemInstance 之后加载，在 Sec_BattleVisuals 之前加载

## 参数设置

### 召唤系统参数

| 参数名 | 描述 | 默认值 |
|--------|------|--------|
| SummonInterval | 召唤间隔（帧） | 30 |
| SummonDistanceX | 初始水平间距 | 120 |
| SummonDistanceStep | 距离递增值 | 40 |
| SummonRangeY | 向下随机范围 | 60 |

## 核心机制详解

基于您提供的最新代码（`Sec_BossMechanics.js` v2.0 和 `Sec_BattleSystemInstance.js` v5.1）以及设计文档，以下是为您新增的 **6 大核心机制** 的详细说明和使用指南。

这些机制专门用于实现“身心之主”的时间回溯、“暗黑怪物”的种族光环以及复杂的召唤逻辑。

-----

### 1\. 快照系统 (Snapshot System)

**功能**：用于实现“时间回溯”或“状态存档”。它可以在战斗中的某个时刻记录角色的状态（HP/MP/TP），并在未来的某个时刻将其恢复。
**挂载位置**：技能备注 (Skill Note)

  * **记录状态 (Record)**

      * **格式**：`<Snapshot: Record, KeyName>`
      * **说明**：将当前使用者的状态保存到名为 `KeyName` 的槽位中。
      * **示例**：`<Snapshot: Record, TimeAnchor>`（记录当前状态为“时间锚点”）

  * **恢复状态 (Restore)**

      * **格式**：`<Snapshot: Restore, KeyName>`
      * **说明**：读取 `KeyName` 槽位的数据。**只有当当前 HP 低于记录时的 HP 时**，才会执行回溯（恢复 HP/MP，不恢复 TP）。
      * **示例**：`<Snapshot: Restore, TimeAnchor>`（回溯到“时间锚点”的状态）

-----

### 2\. 种族光环 (Tribe Bonus)

**功能**：用于实现“暗黑体质”或“种族共鸣”。当场上**所有**存活的敌人都具备某种特性（如都是暗黑族）时，赋予自身属性加成。
**挂载位置**：敌人备注 (Enemy Note)

  * **设置种族/标签**

      * **格式**：`<Key: Value>`
      * **示例**：`<Race: Dark>`（标记该敌人为暗黑族）

  * **设置光环加成**

      * **格式**：`<TribeBonus: MetaKey, MetaVal, ParamId, Rate>`
      * **参数**：
          * `MetaKey`/`MetaVal`：要检测的标签键值对。
          * `ParamId`：属性ID（0=MHP, 1=MMP, 2=攻击, 3=防御, 4=魔攻, 5=魔防, 6=敏捷, 7=幸运）。
          * `Rate`：倍率（1.5 表示 150%）。
      * **说明**：检测场上是否**所有**活着的人都有 `<MetaKey: MetaVal>`。如果是，则自身的 `ParamId` 属性变为 `Rate` 倍。
      * **示例**：`<TribeBonus: Race, Dark, 2, 1.5>`（若全员都是 Dark 族，攻击力提升 50%）

-----

### 3\. 智能召唤 (Smart Summon)

**功能**：用于 Boss 召唤小怪。支持“队列召唤”（一个接一个出）和“位置自动排布”（左右交替，不重叠）。
**挂载位置**：技能备注 (Skill Note)

  * **唯一召唤 (Unique)**

      * **格式**：`<SummonUnique: EnemyId, AnimId>`
      * **说明**：如果场上没有该 ID 的敌人，则召唤；若已有，则不召。`AnimId` 是召唤时播放的动画ID（可选）。
      * **示例**：`<SummonUnique: 10, 120>`（召唤 10 号敌人，播放 120 号动画）

  * **强制召唤 (Force)**

      * **格式**：`<SummonForce: EnemyId, AnimId>`
      * **说明**：无视场上是否已有同类，强制召唤直到填满 8 人上限。
      * **示例**：
        ```
        <SummonForce: 10, 120>
        <SummonForce: 11, 120>
        ```
        （技能里写多行，就会依次把它们加入召唤队列）

-----

### 4\. 状态亡语 (State Trigger)

**功能**：用于“钻地突袭”或“延时爆破”。当某个状态消失（自然回合结束或被驱散）时，强制持有者释放一个技能。
**挂载位置**：状态备注 (State Note)

  * **格式**：`<RemoveTrigger: SkillId>`
  * **说明**：状态移除瞬间，持有者会对**随机/默认目标**强制使用 `SkillId`。
  * **示例**：`<RemoveTrigger: 88>`（状态结束后，自动释放 88 号技能）

-----

### 5\. 条件技能 (Conditional Skill)

**功能**：用于 Boss AI。在释放技能前一瞬间检测战场环境，根据条件动态替换技能。
**挂载位置**：技能备注 (Skill Note)

  * **模式 A：检测 ID (指定某几个敌人是否在场)**

      * **格式**：`<ConditionCheck: ids=[A,B], true=X, false=Y>`
      * **说明**：如果敌人 A 和 B **都活着**，释放技能 X；否则释放技能 Y。
      * **示例**：`<ConditionCheck: ids=[10,11], true=50, false=51>`

  * **模式 B：检测种族 (指定种族是否在场)**

      * **格式**：`<ConditionCheck: meta=Key, value=Val, count=All/Any, true=X, false=Y>`
      * **说明**：
          * `count=All`：全场敌人都是该种族。
          * `count=Any`：场上至少有一个该种族。
      * **示例**：`<ConditionCheck: meta=Race, value=Animal, count=Any, true=60, false=61>`（场上只要有动物，就放技能 60）

-----

### 6\. 自定义脚本 (Custom Script)

**功能**：用于处理极其特殊的逻辑（如巫狼吼叫只给动物加 Buff）。
**挂载位置**：技能备注 (Skill Note)

  * **格式**：`<CustomEffect: JS代码>`
  * **变量**：`a` (使用者), `b` (目标), `v` ($gameVariables)
  * **示例**：`<CustomEffect: if(b.enemy().meta.Race === 'Animal') b.addBuff(2, 3)>`
      * **解释**：如果目标 (b) 的备注里有 `<Race: Animal>`，则给它加 3 回合的攻击力 Buff (paramId 2)。

-----

### 💡 附录：配置速查表

| 机制 | 标签格式 | 填写位置 | 备注 |
| :--- | :--- | :--- | :--- |
| **快照记录** | `<Snapshot: Record, Key>` | 技能 | 记录 HP/MP |
| **快照回溯** | `<Snapshot: Restore, Key>` | 技能 | 恢复 HP/MP |
| **种族定义** | `<Key: Value>` | 敌人 | 例 `<Race: Dark>` |
| **种族光环** | `<TribeBonus: Key, Val, Param, Rate>` | 敌人 | 全员满足时生效 |
| **唯一召唤** | `<SummonUnique: Id, Anim>` | 技能 | 场上无才召 |
| **强制召唤** | `<SummonForce: Id, Anim>` | 技能 | 填满为止 |
| **状态亡语** | `<RemoveTrigger: SkillId>` | 状态 | 状态消失时触发 |
| **条件技能** | `<ConditionCheck: ...>` | 技能 | 替换技能 |
| **自定义脚本** | `<CustomEffect: JS>` | 技能 | 高级用法 |

这些机制已经全部实现在 `Sec_BossMechanics.js` (v2.0) 和 `Sec_BattleSystemInstance.js` (v5.1) 中，您可以直接在数据库中配置使用。

## 高级功能

### 召唤被动效果

在敌人备注中添加以下标签，可以在召唤时自动添加状态：
```
<SummonState: stateId>
```

#### 示例
```
// 召唤时添加无敌状态
<SummonState: 15> // 召唤时添加15号状态
```

### 状态继承机制

- 召唤的敌人会继承召唤者的某些属性
- 位置会基于召唤者进行计算
- 可以通过脚本自定义更多继承规则

## 使用案例

### 案例1：Boss召唤机制

**需求**：Boss每隔一定时间召唤小怪，优先召唤特定类型的敌人。

**实现步骤**：
1. 创建召唤技能，添加以下备注：
   ```
   <SummonForce: 10, 120> // 强制召唤10号敌人，播放120号动画
   <SummonForce: 20, 120> // 强制召唤20号敌人，播放120号动画
   ```
2. 在Boss的AI中设置使用该召唤技能的条件
3. 调整插件参数中的召唤间隔

### 案例2：时间回溯机制

**需求**：Boss使用"和光同尘"技能记录当前状态，4回合后恢复到该状态。

**实现步骤**：
1. 创建记录状态技能，添加以下备注：
   ```
   <Snapshot: Record, BossAnchor> // 记录当前状态
   ```
2. 创建恢复状态技能，添加以下备注：
   ```
   <Snapshot: Restore, BossAnchor> // 恢复到记录状态
   ```
3. 在Boss的AI中设置使用这两个技能的时机

### 案例3：种族光环机制

**需求**：当场上所有敌人都是暗黑种族时，Boss攻击力提升50%。

**实现步骤**：
1. 在Boss的敌人备注中添加：
   ```
   <TribeBonus: Race, Dark, 2, 1.5> // 全员Dark族时攻击力1.5倍
   ```
2. 确保所有小怪也都添加了 `<Race: Dark>` 备注

## 注意事项

1. **性能优化**：避免在高频使用的技能中添加复杂的自定义脚本
2. **兼容性**：确保与其他战斗插件的兼容性，特别是状态和技能相关的插件
3. **错误处理**：自定义脚本中的错误会被捕获并输出到控制台，便于调试
4. **召唤上限**：场上最多同时存在8个敌人，超过时会复用已死亡的敌人位置
5. **状态冲突**：注意状态亡语与其他状态移除效果的冲突

## 调试技巧

1. **控制台输出**：在自定义脚本中使用 `console.log()` 输出调试信息
2. **视觉反馈**：利用快照系统的文字效果验证功能是否正常触发
3. **变量监控**：使用 `v.setValue(1, 数据)` 将调试数据写入游戏变量
4. **分步测试**：将复杂机制拆分为多个简单功能进行测试

## 更新日志

### v2.0 终极版
- 整合了召唤、回溯、条件技能和脚本执行功能
- 优化了召唤系统的位置计算
- 增强了条件技能的检测机制
- 添加了种族光环功能
- 改进了快照系统的视觉反馈
- 修复了多个已知bug

### v1.0 初始版
- 实现了基本的召唤系统
- 添加了快照记录和恢复功能
- 支持简单的条件技能切换

## 作者信息

- **作者**：Secmon (Mechanics)
- **插件名称**：Sec_BossMechanics.js
- **适用引擎**：RPG Maker MZ
- **设计目标**：为Boss战提供丰富的机制扩展

## 许可协议

本插件采用 MIT 许可协议，可自由使用、修改和分发，但请保留作者信息和插件头注释。

## 联系反馈

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 游戏开发论坛
- 邮件联系

---

感谢使用 Sec_BossMechanics.js 插件！该插件为您的Boss战提供了丰富的机制扩展，帮助您创建更加精彩和具有挑战性的战斗体验。
