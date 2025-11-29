/*:
 * @target MZ
 * @plugindesc [重构版v2.6] 战斗系统实例插件 - 终极案例库版
 * @author Secmon (Refactored by Gemini)
 * @version 2.6.0
 *
 * @help
 * ============================================================================
 * ★ 插件功能与终极案例手册 v2.6 ★
 * ============================================================================
 * 本插件允许在【职业】、【敌人】或【技能】的备注栏中填写特定标签。
 * 下文包含各个机制的详细参数说明及海量实战案例。
 *
 * 【通用变量表】(所有公式均可用)
 * a    : 动作使用者 (或 亡语中的死者 / 转移中的守护者)
 * b    : 动作目标   (或 亡语中的凶手 / 转移中的被守护者)
 * v[n] : 游戏变量 (例如 v[10])
 * s[n] : 游戏开关 (例如 s[5])
 * dmg  : 本次行动造成的实际伤害数值 (仅受击/吸血等逻辑可用)
 *
 * ============================================================================
 * 一、被动触发模块 (Passives)
 * ----------------------------------------------------------------------------
 * 填写位置：
 * - 角色：数据库 -> 职业 (Classes) -> 备注
 * - 敌人：数据库 -> 敌人 (Enemies) -> 备注 (支持亡语)
 * ----------------------------------------------------------------------------
 *
 * 1. 普攻特效 (Attack Effect)
 * ----------------------------------------------------------------------------
 * 格式：<战斗触发:Attack, 公式>
 *
 * 【参数详解】
 * [1] 类型 (String):
 * - "Attack": 发起普攻时触发 (仅a有效)。
 * - "Hit":    受到伤害时触发 (a=受击者, b=攻击者)。
 * [2] 公式 (JavaScript):
 * - 任意有效的JS代码。
 *
 * [实战案例库]
 * // 1.【魔剑士】普攻吸魔：每次普攻回复 10点 MP
 * <战斗触发:Attack, a.gainMp(10)>
 *
 * // 2.【狂战士】鲜血渴望：普攻扣自己50血，换取10点怒气(TP)
 * <战斗触发:Attack, a.gainHp(-50); a.gainTp(10)>
 *
 * // 3.【赌徒】幸运一击：20%概率给敌人附加“眩晕”(状态5)
 * <战斗触发:Attack, if(Math.random()<0.2) b.addState(5)>
 *
 * // 4.【盗贼】偷钱：普攻时获得 1~10 金币
 * <战斗触发:Attack, $gameParty.gainGold(Math.floor(Math.random()*10)+1)>
 *
 * ----------------------------------------------------------------------------
 * 2. 受击特效 (Hit Effect)
 * ----------------------------------------------------------------------------
 * 格式：<战斗触发:Hit, 公式>
 *
 * 【参数详解】
 * [1] 类型 (String):
 * - "Attack": 发起普攻时触发 (仅a有效)。
 * - "Hit":    受到伤害时触发 (a=受击者, b=攻击者)。
 * [2] 公式 (JavaScript):
 * - 任意有效的JS代码。
 * 
 * [实战案例库]
 * // 1.【战士】坚韧：受到伤害获得 5点 TP
 * <战斗触发:Hit, a.gainTp(5)>
 *
 * // 2.【重甲卫士】应激防御：受到伤害时，给自己附加“防御提升”(状态30)
 * <战斗触发:Hit, a.addState(30)>
 *
 * // 3.【荆棘怪】反伤甲：受到伤害时，反弹 30% 的真实伤害给攻击者
 * <战斗触发:Hit, b.gainHp(-dmg * 0.3); b.startDamagePopup()>
 *
 * // 4.【幻术师】闪避本能：若受到超过500点伤害，获得“分身”(状态40，提升闪避率)
 * <战斗触发:Hit, if(dmg > 500) a.addState(40)>
 *
 * ----------------------------------------------------------------------------
 * 3. 亡语机制 (Death Rattle)
 * ----------------------------------------------------------------------------
 * 格式：<战斗触发:Dead, 公式>
 * 
 * 【参数详解】
 * [1] 类型固定为 "Dead"。
 * [2] 公式 (JavaScript):
 * - a 代表死者，b 代表造成最后一击的凶手。
 * - 支持多行代码，用分号 ; 隔开。
 *
 * [实战案例库]
 * // 1.【自爆怪】烈焰殉爆：对凶手造成 1000 点固定伤害
 * <战斗触发:Dead, b.gainHp(-1000); b.startDamagePopup()>
 *
 * // 2.【剧毒史莱姆】临死喷溅：让凶手陷入“剧毒”(状态10)
 * <战斗触发:Dead, b.addState(10)>
 *
 * // 3.【圣职者】神圣遗志：死后复活所有队友并回满血 (仅作示例，逻辑需严谨)
 * <战斗触发:Dead, $gameParty.deadMembers().forEach(m => { m.revive(); m.gainHp(9999); })>
 *
 * // 4.【赏金首领】巨额赏金：击杀者获得 5000 金币
 * <战斗触发:Dead, $gameParty.gainGold(5000)>
 *
 *
 * ============================================================================
 * 二、技能主动模块 (Active Skills)
 * ----------------------------------------------------------------------------
 * 填写位置：数据库 -> 技能 (Skills) -> 备注
 * ----------------------------------------------------------------------------
 *
 * 1. 溅射伤害 (Splash Damage)
 * ----------------------------------------------------------------------------
 * 格式：<溅射伤害: 比例, 范围>
 * 参数：[比例 0.0-1.0], [范围 整数]
 *
 * 【参数详解】
 * [1] 比例 (Number):
 * - 0.0 到 1.0 之间的小数，代表溅射伤害的比例。
 * - 例如：0.5 代表 50% 溅射伤害。
 * [2] 范围 (Integer):
 * - 整数，代表溅射伤害的范围。
 * - 例如：1 代表主目标左右各 1 个单位。
 * - 范围越大，溅射伤害的范围就越大。
 *
 * [实战案例库]
 * // 1.【横扫】顺劈斩：对主目标左右各 1 个单位造成 50% 溅射伤害
 * <溅射伤害: 0.5, 1>
 *
 * // 2.【冲击波】直线贯通：对主目标左右各 2 个单位造成 80% 溅射伤害 (宽范围)
 * <溅射伤害: 0.8, 2>
 *
 * // 3.【微风】轻微波及：对左右各 1 个单位造成 10% 的“刮蹭”伤害
 * <溅射伤害: 0.1, 1>
 *
 * ----------------------------------------------------------------------------
 * 2. 斩杀追击 (Execution)
 * ----------------------------------------------------------------------------
 * 格式：<斩杀追击: 阈值%, 公式>
 * 参数：[阈值 1-100], [伤害公式]
 *
 * 【参数详解】
 * [1] 阈值 (Number):
 * - 1 到 100 之间的整数，代表目标血量的百分比。
 * - 例如：30 代表目标血量低于 30% 时触发。
 * [2] 伤害公式 (JavaScript):
 * - 任意有效的JS代码，代表斩杀追击时的伤害值。
 * - 可以使用 a 代表目标，b 代表攻击者。
 * - 例如：2000 代表追加 2000 点真实伤害。
 * - 例如：b.hp 代表直接斩杀 (造成等于当前血量的伤害)。
 *
 * [实战案例库]
 * // 1.【刺客】处决：若目标血量低于 30%，追加 2000 点真实伤害
 * <斩杀追击: 30, 2000>
 *
 * // 2.【死神】灵魂收割：若目标血量低于 10%，直接斩杀 (造成等于当前血量的伤害)
 * <斩杀追击: 10, b.hp>
 *
 * // 3.【猎人】弱点补刀：若目标血量低于 50%，追加 2倍攻击力 的伤害
 * <斩杀追击: 50, a.atk * 2>
 *
 * ----------------------------------------------------------------------------
 * 3. 技能吸血 (Vampirism)
 * ----------------------------------------------------------------------------
 * 格式：<技能吸血: 比例>
 * 参数：[比例 0.0-1.0]
 *
 * 【参数详解】
 * [1] 比例 (Number):
 * - 0.0 到 1.0 之间的小数，代表技能吸血的比例。
 * - 例如：0.3 代表回复伤害值 30% 的血量。
 * - 例如：1.0 代表造成多少伤害就回多少血 (100%吸血)。
 * - 例如：0.05 代表带有少量吸血效果(5%)的神圣打击。
 *
 * [实战案例库]
 * // 1.【吸血鬼】吸血之触：回复伤害值 30% 的血量
 * <技能吸血: 0.3>
 *
 * // 2.【黑暗骑士】生命吞噬：造成多少伤害就回多少血 (100%吸血)
 * <技能吸血: 1.0>
 *
 * // 3.【圣骑士】微量回覆：带有少量吸血效果(5%)的神圣打击
 * <技能吸血: 0.05>
 *
 * ----------------------------------------------------------------------------
 * 4. 状态交互 (State Interaction)
 * ----------------------------------------------------------------------------
 * 格式：<状态交互: 状态ID, 公式, 移除?, 范围>
 * 范围：Target, Self, AllAllies
 * 公式：正数伤，负数奶
 *
 * 【参数详解】
 * [1] 状态ID (Number):
 * - 整数，代表目标或队友的状态ID。
 * - 例如：15 代表“冻结”(状态15)。
 * - 例如：10 代表“中毒”(状态10)。
 * - 例如：20 代表“力量祝福”(状态20)。
 * - 例如：30 代表“瘟疫”(状态30)。
 * [2] 公式 (JavaScript):
 * - 任意有效的JS代码，代表状态交互时的伤害值或回复血量。
 * - 可以使用 a 代表目标，b 代表攻击者。
 * - 例如：a.mat * 3 代表造成 3倍魔攻伤害。
 * - 例如：-500 代表回复 500 血。
 * [3] 移除? (Boolean):
 * - true 代表移除目标或队友的状态。
 * - false 代表不移除状态，仅造成伤害或回复血量。
 * [4] 范围 (String):
 * - Target 代表仅对目标生效。
 * - Self 代表仅对自己生效。
 * - AllAllies 代表对所有队友生效。
 *
 * [实战案例库]
 * // 1.【法师】冰火引爆：若目标有“冻结”(状态15)，造成 3倍魔攻伤害并移除冻结
 * <状态交互: 15, a.mat * 3, true, Target>
 *
 * // 2.【牧师】净化术：若队友有“中毒”(状态10)，移除它，并回复 500 血
 * <状态交互: 10, -500, true, AllAllies>
 *
 * // 3.【恶魔】吞噬力量：若自己有“力量祝福”(状态20)，移除它，回复 1000 血
 * <状态交互: 20, -1000, true, Self>
 *
 * // 4.【死灵】疫病加重：若目标有“瘟疫”(状态30)，不移除，再造成 500 伤害
 * <状态交互: 30, 500, false, Target>
 *
 * ----------------------------------------------------------------------------
 * 5. 力场共鸣 (Field Resonance)
 * ----------------------------------------------------------------------------
 * 格式：<力场共鸣: 状态ID, 模式, 公式, 移除?>
 * 模式：Spread(炸全场), Gather(聚合并炸单体,可用变量n)
 *
 * 【参数详解】
 * [1] 状态ID (Number):
 * - 整数，代表目标或队友的状态ID。
 * - 例如：50 代表“尸体标记”(状态50)。
 * - 例如：60 代表“光之印记”(状态60)。
 * - 例如：70 代表“回春”(状态70)。
 * [2] 模式 (String):
 * - Spread 代表对全场生效。
 * - Gather 代表对所有带有该状态的单位生效。
 * [3] 公式 (JavaScript):
 * - 任意有效的JS代码，代表力场共鸣时的伤害值或回复血量。
 * - 可以使用 a 代表目标，b 代表攻击者。
 * - 例如：a.mat * 2 代表造成 2倍魔攻伤害。
 * - 例如：-1000 代表回复 1000 血。
 * [4] 移除? (Boolean):
 * - true 代表移除目标或队友的状态。
 * - false 代表不移除状态，仅造成伤害或回复血量。
 *
 * [实战案例库]
 * // 1.【术士】连环尸爆 (Spread)：
 * // 引爆全场所有带有“尸体标记”(状态50)的单位，造成魔攻2倍伤害，移除标记
 * <力场共鸣: 50, Spread, a.mat * 2, true>
 *
 * // 2.【贤者】光之聚合 (Gather)：
 * // 统计全场带有“光之印记”(状态60)的人数n，对BOSS造成 n * 2000 伤害
 * <力场共鸣: 60, Gather, n * 2000, true>
 *
 * // 3.【辅助】共鸣治疗 (Spread)：
 * // 让全场带有“回春”(状态70)的单位瞬间回复 1000 血 (公式写负数)
 * <力场共鸣: 70, Spread, -1000, false>
 *
 *
 * ============================================================================
 * 三、高级机制模块 (Advanced)
 * ----------------------------------------------------------------------------
 * 填写位置：数据库 -> 技能 (Skills) -> 备注
 * ----------------------------------------------------------------------------
 *
 * 1. 伤害转移 (Damage Transfer)
 * ----------------------------------------------------------------------------
 * 格式：<伤害转移: 状态ID, 分摊比例%, 转移公式, 恢复公式>
 * 变量 d: 原始伤害值
 * 变量 n: 队友数量
 * 
 * 【参数详解】
 * [1] 状态ID (Number):
 * - 整数，代表目标或队友的状态ID。
 * - 例如：100 代表“守护骑士”(状态100)。
 * - 例如：101 代表“灵魂锁链”(状态101)。
 * - 例如：102 代表“狂信徒”(状态102)。
 * [2] 分摊比例% (Number):
 * - 0.0 到 100.0 之间的小数，代表伤害转移的比例。
 * - 例如：50 代表伤害被分摊到队友各一半。
 * - 例如：100 代表伤害被完全拦截。
 * [3] 转移公式 (JavaScript):
 * - 任意有效的JS代码，代表伤害转移时的伤害值。
 * - 可以使用 d 代表原始伤害值。
 * - 例如：d * 0.5 代表转移 50% 伤害。
 * - 例如：d * 0.3 * n 代表转移 30% 伤害，每人额外多 30% 伤害 (按队友数量n)。
 * [4] 恢复公式 (JavaScript):
 * - 任意有效的JS代码，代表被守护者(b)要回多少血 (用于抵消原始伤害)。
 * - 可以使用 d 代表原始伤害值。
 * - 例如：d * 0.5 代表回复 50% 伤害。
 * - 例如：d * 0.3 * n 代表回复 30% 伤害，每人额外多 30% 回复 (按队友数量n)。
 *
 *
 * [实战案例库]
 * // 1.【守护骑士】完全援护：
 * // 队友受到的伤害100%被拦截。骑士防御高，只受 50% 伤害。队友完全不扣血。
 * // 状态ID: 100
 * <伤害转移: 100, 100, d * 0.5, d>
 *
 * // 2.【灵魂锁链】痛苦分担：
 * // 队友受到的伤害，50%转移给施法者。两人各承受一半。
 * // 状态ID: 101
 * <伤害转移: 101, 50> 
 * (注：省略公式则默认按比例扣除守护者血量，并让队友回血抵消该比例)
 *
 * // 3.【狂信徒】牺牲祝福：
 * // 队友受伤时，狂信徒承受 100% 伤害。队友反而回复 伤害值x1.5 的血量(过量治疗)。
 * // 状态ID: 102
 * <伤害转移: 102, 100, d, d * 1.5>
 *
 * ----------------------------------------------------------------------------
 * 2. 累计反击 (Accumulated Counter)
 * ----------------------------------------------------------------------------
 * 格式：<累计反击: 状态ID, 属性, 值, 反击公式>
 * 变量 d: 蓄力期间累计伤害
 * 变量 n: 队友数量
 * 
 * 【参数详解】
 * [1] 状态ID (Number):
 * - 整数，代表目标或队友的状态ID。
 * - 例如：110 代表“盾卫”(状态110)。
 * - 例如：111 代表“剑圣”(状态111)。
 * - 例如：112 代表“武僧”(状态112)。
 * [2] 属性 (String):
 * - 开启期间提升的属性: "def"(防), "atk"(攻), "mat"(魔攻), "hp"(血上限)等。
 * [3] 值 (Integer): 属性提升的数值。
 * - 例如：200 代表“盾卫”开启姿态时，防御力(def) + 200。
 * - 例如：50 代表“剑圣”开启姿态时，攻击力(atk) + 50。
 * - 例如：1000 代表“武僧”开启姿态时，血上限(hp) + 1000 (临时撑血)。
 * [4] 反击公式 (JavaScript):
 * - 释放时的伤害公式。
 * - 变量 d: 蓄力期间累计受到的伤害总和。
 * - 例如：d * 3 代表造成 (累计受到伤害 * 3) 的反击伤害。
 * - 例如：a.atk * 10 代表造成 (施法者攻击力 * 10) 的拔刀斩伤害。
 * - 例如：d * 0.5 * n 代表造成 (累计受到伤害 * 0.5) 伤害，每人额外多 50% 伤害 (按队友数量n)。
 *
 * [实战案例库]
 * // 1.【盾卫】盾牌反击：
 * // 开启姿态(状态110)：防御力(def) + 200。
 * // 再次释放：造成 (累计受到伤害 * 3) 的反击伤害。
 * <累计反击: 110, def, 200, d * 3>
 *
 * // 2.【剑圣】冥想蓄力：
 * // 开启姿态(状态111)：攻击力(atk) + 50。
 * // 再次释放：与受到的伤害无关，造成 (a.atk * 10) 的拔刀斩伤害。
 * <累计反击: 111, atk, 50, a.atk * 10>
 *
 * // 3.【武僧】忍耐：
 * // 开启姿态(状态112)：血上限(hp) + 1000 (临时撑血)。
 * // 再次释放：将受到的痛苦转化为 (d * 5) 的真实伤害打回去。
 * <累计反击: 112, hp, 1000, d * 5>
 *
 * ----------------------------------------------------------------------------
 * 3. 弹射伤害 (Ricochet)
 * ----------------------------------------------------------------------------
 * 格式：<弹射伤害: 初始公式, 弹射公式, 次数, 倍率上限, 允许重复?, 模式>
 * 变量 damage: 上一次伤害 / n: 当前第几次
 *
 * [实战案例库]
 * // 1.【雷电法师】闪电链 (经典)：
 * // 首发3000伤害。弹射3次。每次伤害衰减20% (damage*0.8)。随机目标。
 * <弹射伤害: 3000, damage * 0.8, 3, 0, false, Random>
 *
 * // 2.【猎手】回旋镖 (顺序)：
 * // 首发物攻2倍。弹射4次。伤害不衰减。按敌人站位顺序依次打击。
 * <弹射伤害: a.atk*2, damage, 4, 0, false, Order>
 *
 * // 3.【混沌法师】混乱法球 (递增)：
 * // 首发500。弹射5次。每次伤害增加500 (damage+500)。允许重复打同一个人(true)。
 * <弹射伤害: 500, damage + 500, 5, 0, true, Random>
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginName = "BattleSystemInstance";

    // ======================================================================
    // 1. 全局数据存储
    // ======================================================================
    const _Sec_AccumulatedDamage = new Map();
    const _Sec_TransferMarker = new Map();

    // ======================================================================
    // 2. 核心逻辑挂钩：Game_Action.prototype.executeDamage
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        
        // ------------------------------------------------------------------
        // 2.0 执行原版逻辑
        // ------------------------------------------------------------------
        _Game_Action_executeDamage.call(this, target, value);

        const subject = this.subject();
        const item = this.item();
        const actualDamage = target.result().hpDamage; // 核心：获取实际伤害

        // ------------------------------------------------------------------
        // 2.1 【模块 A】 被动机制 (Passives)
        // ------------------------------------------------------------------
        
        // --- A1. 普攻特效 (仅角色) ---
        if (subject && subject.isActor() && this.isAttack()) {
            const classData = subject.currentClass();
            if (classData && classData.note) {
                const matches = classData.note.matchAll(/<战斗触发:Attack,([^>]+)>/gi);
                for (const match of matches) {
                    const formula = match[1].trim();
                    try {
                        const a = subject, b = target, v = $gameVariables._data, s = $gameSwitches._data;
                        const dmg = actualDamage;
                        if (formula.includes('gainMp')) subject._ignoreMpLog = true;
                        eval(formula);
                        subject._ignoreMpLog = false;
                    } catch (e) { console.error(`[Sec] A1 Error`, e); }
                }
            }
        }

        // --- A2. 受击特效 (仅角色) ---
        if (target && target.isActor()) {
            const result = target.result();
            if (result.isHit() || actualDamage > 0) {
                const classData = target.currentClass();
                if (classData && classData.note) {
                    const matches = classData.note.matchAll(/<战斗触发:Hit,([^>]+)>/gi);
                    for (const match of matches) {
                        const formula = match[1].trim();
                        try {
                            const a = target, b = subject, v = $gameVariables._data, s = $gameSwitches._data;
                            const dmg = actualDamage;
                            if (formula.includes('gainMp')) target._ignoreMpLog = true;
                            eval(formula);
                            target._ignoreMpLog = false;
                        } catch (e) { console.error(`[Sec] A2 Error`, e); }
                    }
                }
            }
        }

        // --- A3. 亡语 (Death Effects) ---
        if (target && target.isDead()) {
             let noteData = "";
             
             if (target.isActor()) {
                 const classData = target.currentClass();
                 if (classData) noteData = classData.note;
             } else if (target.isEnemy()) {
                 const enemyData = target.enemy();
                 if (enemyData) noteData = enemyData.note;
             }

             if (noteData) {
                const matches = noteData.matchAll(/<战斗触发:Dead,([^>]+)>/gi);
                for (const match of matches) {
                    const formula = match[1].trim();
                    try {
                        const a = target; // 死者
                        const b = subject; // 凶手
                        const v = $gameVariables._data;
                        const s = $gameSwitches._data;
                        eval(formula);
                    } catch (e) { 
                        console.error(`[Sec] A3(亡语) 执行错误`, e); 
                    }
                }
             }
        }

        if (!item) return;

        // ------------------------------------------------------------------
        // 2.2 【模块 B】 技能主动机制 (Skill Actives)
        // ------------------------------------------------------------------
        const note = item.note;
        
        // --- B1. 状态交互 ---
        const stateInteractMatches = note.matchAll(/<状态交互:(\d+),([^,]+),([^,]+),([^>]+)>/g);
        for (const match of stateInteractMatches) {
            const stateId = parseInt(match[1]);
            const formula = match[2].trim();
            const removeState = match[3].trim().toLowerCase() === 'true';
            const range = match[4].trim().toLowerCase();

            let targets = [];
            if (range === 'target') targets = [target];
            else if (range === 'allallies') targets = $gameParty.members();
            else if (range === 'self') targets = [subject];

            targets.forEach(t => {
                if (t.isAlive() && t.isStateAffected(stateId)) {
                    try {
                        const a = subject, b = t, v = $gameVariables._data;
                        const val = Math.floor(eval(formula));
                        if (val > 0) { 
                            t.gainHp(-val);
                            if (t.result().hpAffected) t.startDamagePopup();
                        } else if (val < 0) { 
                            t.gainHp(-val); 
                            if (t.result().hpAffected) t.startDamagePopup();
                        }
                        if (removeState) t.removeState(stateId);
                    } catch (e) { console.error(`[Sec] B1 Error`, e); }
                }
            });
        }

        // --- B2. 力场共鸣 ---
        const fieldResMatches = note.matchAll(/<力场共鸣:(\d+),([^,]+),([^,]+),([^>]+)>/g);
        for (const match of fieldResMatches) {
            const stateId = parseInt(match[1]);
            const mode = match[2].trim().toLowerCase();
            const formula = match[3].trim();
            const removeState = match[4].trim().toLowerCase() === 'true';

            const allBattlers = $gameParty.members().concat($gameTroop.members());
            const affectedMembers = allBattlers.filter(m => m.isAlive() && m.isStateAffected(stateId));

            if (mode === 'spread') {
                setTimeout(() => {
                    affectedMembers.forEach(m => {
                        try {
                            const a = subject, b = m, v = $gameVariables._data;
                            const val = Math.floor(eval(formula));
                            if (val > 0) {
                                m.gainHp(-val);
                                if (m.result().hpAffected) m.startDamagePopup();
                                m.performDamage(); 
                                if (m.isDead()) m.performCollapse();
                            }
                        } catch(e) {}
                    });
                    if (removeState) affectedMembers.forEach(m => m.removeState(stateId));
                }, 200);
            } else if (mode === 'gather') {
                const n = affectedMembers.length;
                if (n > 0) {
                    try {
                        const a = subject, b = target, v = $gameVariables._data;
                        const val = Math.floor(eval(formula));
                        if (val > 0) {
                            target.gainHp(-val);
                            if (target.result().hpAffected) target.startDamagePopup();
                            target.performDamage();
                        }
                        if (removeState) affectedMembers.forEach(m => m.removeState(stateId));
                    } catch(e) {}
                }
            }
        }

        // --- B3. 溅射伤害 ---
        const splashMatch = note.match(/<溅射伤害:([\d\.]+),(\d+)>/);
        if (splashMatch && actualDamage > 0) {
            const rate = parseFloat(splashMatch[1]);
            const range = parseInt(splashMatch[2]);
            const friends = target.friendsUnit(); 
            const centerIndex = target.index();
            
            const neighbors = friends.members().filter(member => {
                const idx = member.index();
                return member !== target && 
                       member.isAlive() && 
                       Math.abs(idx - centerIndex) <= range;
            });
            
            neighbors.forEach(n => {
                const splashDmg = Math.floor(actualDamage * rate);
                if (splashDmg > 0) {
                    n.gainHp(-splashDmg);
                    n.startDamagePopup(); 
                    if (n.isDead()) n.performCollapse();
                }
            });
        }

        // --- B4. 斩杀追击 ---
        const execMatch = note.match(/<斩杀追击:(\d+),([^>]+)>/);
        if (execMatch) {
            const threshold = parseInt(execMatch[1]) / 100;
            const formula = execMatch[2].trim();
            
            if (target.hpRate() < threshold && target.isAlive()) {
                try {
                    const a = subject, b = target, v = $gameVariables._data, dmg = actualDamage;
                    const bonusDmg = Math.floor(eval(formula));
                    
                    if (bonusDmg > 0) {
                        setTimeout(() => {
                            target.gainHp(-bonusDmg);
                            target.startDamagePopup();
                            if (target.isDead()) target.performCollapse();
                        }, 100);
                    }
                } catch(e) { console.error("[Sec] 斩杀计算错误", e); }
            }
        }

        // --- B5. 技能吸血 ---
        const drainMatch = note.match(/<技能吸血:([\d\.]+)>/);
        if (drainMatch && actualDamage > 0) {
            const rate = parseFloat(drainMatch[1]);
            const healAmount = Math.floor(actualDamage * rate);
            
            if (healAmount > 0 && subject.isAlive()) {
                subject.gainHp(healAmount);
                subject.startDamagePopup();
            }
        }


        // ------------------------------------------------------------------
        // 2.3 【模块 C】 高级与遗留机制
        // ------------------------------------------------------------------
        
        // --- C1. 状态循环 ---
        const stateCycleMatch = note.match(/<状态循环:([^>]+)>/);
        if (stateCycleMatch) {
            const stateIds = stateCycleMatch[1].split(',').map(id => parseInt(id.trim()));
            if (stateIds.length >= 2) {
                let currentIndex = stateIds.findIndex(id => target.isStateAffected(id));
                if (currentIndex === -1) {
                    target.addState(stateIds[0]);
                } else if (currentIndex < stateIds.length - 1) {
                    target.removeState(stateIds[currentIndex]);
                    target.addState(stateIds[currentIndex + 1]);
                }
            }
        }

        // --- C2. 复杂流程 (反击/转移/弹射) ---
        if (!this._specialEffectsProcessed) {
            this._specialEffectsProcessed = true;
            if (subject) subject._counterAttackBuffApplied = false;
            processComplexFeatures.call(this, subject, target, note);
        }
    };


    /**
     * 处理复杂的遗留功能
     */
    function processComplexFeatures(user, target, note) {
        // 功能 8：累计反击
        const counterMatch = note.match(/<累计反击:(\d+),([^,]+),([^,]+),([^>]+)>/);
        if (counterMatch) {
            const stateId = parseInt(counterMatch[1]);
            const statType = counterMatch[2].trim().toLowerCase();
            const statValue = counterMatch[3].trim();
            const counterFormula = counterMatch[4].trim();

            if (user.isStateAffected(stateId)) {
                try {
                    const actorId = user.isActor() ? user.actorId() : -user.enemyId();
                    const accumulatedDamage = _Sec_AccumulatedDamage.get(actorId) || 0;
                    const a = user, b = target, d = accumulatedDamage, v = $gameVariables._data;
                    const damage = Math.floor(eval(counterFormula));
                    
                    if (damage > 0) {
                        if (this.isForAll()) {
                            this.targetsForOpponents().forEach(t => {
                                t.gainHp(-damage);
                                if (t.result().hpAffected) t.startDamagePopup();
                                if (t.isDead() && BattleManager._logWindow) BattleManager._logWindow.push('performCollapse', t);
                            });
                        } else {
                            target.gainHp(-damage);
                            if (target.result().hpAffected) target.startDamagePopup();
                            if (target.isDead() && BattleManager._logWindow) BattleManager._logWindow.push('performCollapse', target);
                        }
                    }
                    user.removeState(stateId);
                    user._counterAttackBuffApplied = false;
                    _Sec_AccumulatedDamage.set(actorId, 0);
                } catch(e) { console.error("[Sec] 累计反击释放错误", e); }
            } else {
                 if (!user._counterAttackBuffApplied) {
                    user.addState(stateId);
                    user._counterAttackBuffApplied = true;
                    const actorId = user.isActor() ? user.actorId() : -user.enemyId();
                    _Sec_AccumulatedDamage.set(actorId, 0);
                    try {
                        const a = user, v = $gameVariables._data;
                        const value = Math.floor(eval(statValue));
                        const paramMap = { 'def':3, 'mdef':5, 'atk':2, 'mat':4, 'agi':6, 'luk':7 };
                        if(paramMap[statType]) user._paramPlus[paramMap[statType]] += value;
                        else if(statType === 'hp') user.gainHp(value);
                        user.refresh();
                    } catch(e){}
                }
            }
        }

        // 功能 9：伤害转移
        const dtMatch = note.match(/<伤害转移:(\d+),([\d\.]+)(?:,([^,>]+)(?:,([^>]+))?)?>/);
        if (dtMatch) {
             const stateId = parseInt(dtMatch[1]);
             const rate = parseFloat(dtMatch[2]);
             if (user.isStateAffected(stateId)) {
                 user.removeState(stateId);
                 $gameParty.members().forEach(m => _Sec_TransferMarker.delete(m.actorId()));
             } else {
                 user.addState(stateId);
                 const userId = user.isActor() ? user.actorId() : -user.enemyId();
                 $gameParty.members().forEach(m => {
                     _Sec_TransferMarker.set(m.actorId(), {
                         markerId: userId,
                         transferRate: rate,
                         transferFormula: dtMatch[3],
                         recoverFormula: dtMatch[4]
                     });
                 });
             }
        }

        // 功能 10：弹射伤害
        const ricochetMatch = note.match(/<弹射伤害:([^,]+),([^,]+),(\d+),(\d+),([^,]+),([^>]+)>/);
        if (ricochetMatch) {
            const initFormula = ricochetMatch[1];
            const ricochetFormula = ricochetMatch[2];
            const maxBounces = parseInt(ricochetMatch[3]);
            const damageCapM = parseInt(ricochetMatch[4]);
            let allowRepeat = ricochetMatch[5].trim().toLowerCase() === 'true';
            const mode = ricochetMatch[6].trim().toLowerCase();
            
            if (mode === 'random') allowRepeat = true;

            try {
                const a = user, b = target, v = $gameVariables._data;
                const initDmg = Math.floor(eval(initFormula));
                if(initDmg > 0) {
                    target.gainHp(-initDmg);
                    if (target.result().hpAffected) target.startDamagePopup();
                    target.performDamage();
                }

                const allEnemies = $gameTroop.members().filter(e => !e.isDead());
                let bouncePool = [];
                if (mode === 'random') bouncePool = allEnemies; 
                else {
                    bouncePool = allEnemies.filter(e => e !== target);
                    bouncePool.sort((a, b) => a.index() - b.index());
                }

                let targetsSequence = [];
                if (bouncePool.length > 0) {
                     if (mode === 'random') {
                        for (let i = 0; i < maxBounces; i++) targetsSequence.push(bouncePool[Math.floor(Math.random() * bouncePool.length)]);
                    } else {
                        if (allowRepeat) for (let i = 0; i < maxBounces; i++) targetsSequence.push(bouncePool[i % bouncePool.length]);
                        else targetsSequence = bouncePool.slice(0, Math.min(maxBounces, bouncePool.length));
                    }
                }

                let stepDelay = 150;
                if (targetsSequence.length > 3) stepDelay = Math.max(30, 150 - (targetsSequence.length - 3) * 20);

                targetsSequence.forEach((enemy, index) => {
                     const realN = index + 1;
                     const delay = realN * stepDelay;
                     const n = (damageCapM > 0) ? Math.min(realN, damageCapM) : realN;
                     setTimeout(() => {
                         if (enemy.isDead()) return;
                         let damage = 0;
                         try {
                             const a = user, b = enemy, v = $gameVariables._data;
                             damage = Math.floor(eval(ricochetFormula));
                         } catch (e) {}
                         
                         if (damage > 0) {
                             const originalHp = enemy.hp;
                             enemy.gainHp(-damage);
                             enemy._ignoreDamageLog = true;
                             const originalResult = enemy._result;
                             enemy._result = { hpDamage: damage, missed: false, evaded: false, hpAffected: true };
                             enemy.startDamagePopup();
                             enemy.performDamage();
                             enemy._result = originalResult;
                             if (enemy.isDead() && originalHp > 0) {
                                 if (BattleManager._logWindow) BattleManager._logWindow.push('performCollapse', enemy);
                             }
                         }
                     }, delay);
                });
            } catch(e) {}
        }
    }

    // ======================================================================
    // 3. 挂钩：Game_Action.prototype.apply
    // ======================================================================
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        const result = target.result();
        if (result.isHit() && result.hpDamage > 0) {
            const damageValue = result.hpDamage;
            if (target.isActor()) {
                const actorId = target.actorId();
                const accumulated = _Sec_AccumulatedDamage.get(actorId) || 0;
                _Sec_AccumulatedDamage.set(actorId, accumulated + damageValue);

                const transferInfo = _Sec_TransferMarker.get(actorId);
                if (transferInfo) {
                    const markerActor = $gameActors.actor(transferInfo.markerId);
                    if (markerActor && !markerActor.isDead()) {
                        let transferDamage = 0, recoverAmount = 0;
                        try {
                            const d = damageValue;
                            const r = transferInfo.transferRate / 100;
                            const mhp = markerActor.mhp, def = markerActor.def, mdef = markerActor.mdf;
                            
                            // 1. 计算守护者（markerActor, 即变量a）应受到的伤害
                            if (transferInfo.transferFormula) {
                                const a = markerActor; // 守护者
                                const b = target;      // 被守护者
                                transferDamage = Math.floor(eval(transferInfo.transferFormula));
                            } else {
                                transferDamage = Math.floor(d * r * (1 + mhp/1000) * (1 - Math.min(0.5, def/1000) - Math.min(0.3, mdef/1000)));
                            }
                            transferDamage = Math.max(1, transferDamage);

                            // 2. 计算被守护者（target, 即变量b）应恢复的血量
                            if (transferInfo.recoverFormula) {
                                const a = markerActor; 
                                const b = target;
                                recoverAmount = Math.floor(eval(transferInfo.recoverFormula));
                            } else {
                                recoverAmount = Math.floor(d * r * (1 + mhp/2000));
                            }
                            recoverAmount = Math.max(0, recoverAmount);
                        } catch(e) {}

                        if (!target.isDead()) {
                            setTimeout(() => {
                                target.gainHp(recoverAmount);
                                const tempRes = target._result;
                                target._result = { hpDamage: -recoverAmount, hpAffected: true, missed: false, evaded: false };
                                target.startDamagePopup();
                                target._result = tempRes;
                            }, 300);
                        }

                        markerActor.gainHp(-transferDamage);
                        markerActor._ignoreDamageLog = true;
                        markerActor.result().hpDamage = transferDamage;
                        markerActor.result().hpAffected = true;
                        markerActor.startDamagePopup();
                        markerActor.performDamage();
                        if (markerActor.isDead()) {
                             $gameParty.members().forEach(m => _Sec_TransferMarker.delete(m.actorId()));
                             markerActor.performCollapse();
                        }
                    }
                }
            }
        }
    };

    // ======================================================================
    // 4. 挂钩：BattleManager.startAction
    // ======================================================================
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        const all = $gameParty.members().concat($gameTroop.members());
        all.forEach(b => {
            b._ignoreMpLog = undefined;
            b._ignoreDamageLog = undefined;
        });
        _BattleManager_startAction.call(this);
    };

})();