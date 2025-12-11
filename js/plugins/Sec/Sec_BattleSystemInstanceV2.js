/*:
 * @target MZ
 * @plugindesc [战斗] 核心机制扩展包 V2：召唤/回溯/种族/脚本 (v2.1 全参数开放版)
 * @author Secmon (Mechanics V2)
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 * @orderBefore Sec_BattleVisuals
 *
 * @help
 * ============================================================================
 * Sec_BattleSystemInstanceV2.js (v2.1)
 * ============================================================================
 * 这是 Sec_BattleSystemInstance 的官方扩展包 V2。
 * 整合了所有高级 Boss 机制，并开放了所有视觉反馈参数。
 *
 * 【功能模块一览】
 *
 * 1. 🩸 快照系统 (Snapshot) - 用于时间回溯
 * - <Snapshot: Record, KeyName>
 * 记录当前 HP/MP/TP 到指定 Key。
 * - <Snapshot: Restore, KeyName>
 * 读取 Key，若当前 HP 低于记录值，则回溯状态。
 *
 * 2. 🦇 种族光环 (Tribe Bonus) - 用于暗黑体质
 * - 敌人备注: <Race: Dark> (定义种族)
 * - 敌人备注: <TribeBonus: Race, Dark, 2, 1.5>
 * (当场上所有敌人都具备 <Race: Dark> 时，自身 2号属性(攻击) 变为 1.5 倍)
 * * ParamID: 0=MHP, 1=MMP, 2=ATK, 3=DEF, 4=MAT, 5=MDF, 6=AGI, 7=LUK
 *
 * 3. 👻 智能召唤 (Summon) - 用于 Boss 召唤小怪
 * - <SummonUnique: EnemyId, AnimId> (场上没有才召)
 * - <SummonForce: EnemyId, AnimId>  (强制填满 8 人)
 * - 特性：自动队列（一个接一个出）、位置自动排布（左右交替）。
 *
 * 4. 💣 状态亡语 (State Trigger) - 用于钻地突袭/延时爆破
 * - 状态备注: <RemoveTrigger: SkillId>
 * 当状态移除（自然结束或被驱散）时，强制释放指定技能。
 *
 * 5. 🧠 条件技能 (Conditional Skill) - 用于 AI 变招
 * - <ConditionCheck: ids=[1,2], true=X, false=Y>
 * (检测 ID 1和2 是否都在场)
 * - <ConditionCheck: meta=Race, value=Dark, count=All, true=X, false=Y>
 * (检测场上是否 全员(All) 或 任意(Any) 都是 Dark 族)
 *
 * 6. ⚡ 自定义脚本 (Custom Effect) - 万能扩展
 * - <CustomEffect: JS代码>
 * 变量: a(使用者), b(目标), v($gameVariables)
 * 示例: <CustomEffect: if(b.isStateAffected(10)) b.addBuff(2,3)>
 *
 * ============================================================================
 * @param ---Summon Settings---
 * @text [召唤] 机制设置
 * @default
 *
 * @param SummonInterval
 * @parent ---Summon Settings---
 * @text 召唤间隔(帧)
 * @desc 连续召唤多个敌人时，每个敌人出现的间隔时间。
 * @type number
 * @default 30
 *
 * @param SummonDistanceX
 * @parent ---Summon Settings---
 * @text 初始水平间距
 * @desc 第1、2个召唤物距离召唤者的基础水平距离。
 * @type number
 * @default 120
 *
 * @param SummonDistanceStep
 * @parent ---Summon Settings---
 * @text 距离递增值
 * @desc 每次召唤后，下一次召唤距离增加的像素值。
 * @type number
 * @default 40
 *
 * @param SummonRangeY
 * @parent ---Summon Settings---
 * @text 向下随机范围
 * @desc 召唤物在 Y 轴上相对于召唤者的向下随机偏移量。
 * @type number
 * @default 60
 *
 * @param SummonFallbackX
 * @parent ---Summon Settings---
 * @text 默认出现X坐标
 * @desc 当召唤者死亡或不存在时，召唤物出现的屏幕X中心点。
 * @type number
 * @default 400
 *
 * @param SummonFallbackY
 * @parent ---Summon Settings---
 * @text 默认出现Y坐标
 * @desc 当召唤者死亡或不存在时，召唤物出现的屏幕Y中心点。
 * @type number
 * @default 300
 *
 * @param ---Snapshot Settings---
 * @text [快照] 表现设置
 * @default
 *
 * @param SnapshotRecordText
 * @parent ---Snapshot Settings---
 * @text 记录-提示文本
 * @desc 触发快照记录时弹出的文字。
 * @default Time Anchor
 *
 * @param SnapshotRecordColor
 * @parent ---Snapshot Settings---
 * @text 记录-提示颜色
 * @desc 记录提示文字的颜色 (HEX)。
 * @default #88AAFF
 *
 * @param SnapshotRecordStyle
 * @parent ---Snapshot Settings---
 * @text 记录-弹出风格
 * @desc 可选: impact, shake, jump, expand, contract, pulse, slash, rise
 * @type select
 * @option impact
 * @option shake
 * @option jump
 * @option expand
 * @option contract
 * @option pulse
 * @option slash
 * @option rise
 * @default pulse
 *
 * @param SnapshotRecordWait
 * @parent ---Snapshot Settings---
 * @text 记录-停留帧数
 * @type number
 * @default 40
 *
 * @param SnapshotRestoreText
 * @parent ---Snapshot Settings---
 * @text 回溯-提示文本
 * @desc 触发时间回溯时弹出的文字。
 * @default Revert
 *
 * @param SnapshotRestoreColor
 * @parent ---Snapshot Settings---
 * @text 回溯-提示颜色
 * @desc 回溯提示文字的颜色 (HEX)。
 * @default #FFFFFF
 *
 * @param SnapshotRestoreStyle
 * @parent ---Snapshot Settings---
 * @text 回溯-弹出风格
 * @type select
 * @option impact
 * @option shake
 * @option jump
 * @option expand
 * @option contract
 * @option pulse
 * @option slash
 * @option rise
 * @default rise
 *
 * @param SnapshotRestoreWait
 * @parent ---Snapshot Settings---
 * @text 回溯-停留帧数
 * @type number
 * @default 60
 *
 * @param SnapshotRestoreAnim
 * @parent ---Snapshot Settings---
 * @text 回溯-播放动画
 * @desc 触发回溯时播放的动画ID。
 * @type animation
 * @default 49
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleSystemInstanceV2";
    const parameters = PluginManager.parameters(pluginName);

    // 参数封装
    const V2_Params = {
        summon: {
            interval: Number(parameters['SummonInterval'] || 30),
            distX: Number(parameters['SummonDistanceX'] || 120),
            distStep: Number(parameters['SummonDistanceStep'] || 40),
            rangeY: Number(parameters['SummonRangeY'] || 60),
            fallbackX: Number(parameters['SummonFallbackX'] || 400),
            fallbackY: Number(parameters['SummonFallbackY'] || 300)
        },
        snapshot: {
            recText: String(parameters['SnapshotRecordText'] || "Time Anchor"),
            recColor: String(parameters['SnapshotRecordColor'] || "#88AAFF"),
            recStyle: String(parameters['SnapshotRecordStyle'] || "pulse"),
            recWait: Number(parameters['SnapshotRecordWait'] || 40),
            resText: String(parameters['SnapshotRestoreText'] || "Revert"),
            resColor: String(parameters['SnapshotRestoreColor'] || "#FFFFFF"),
            resStyle: String(parameters['SnapshotRestoreStyle'] || "rise"),
            resWait: Number(parameters['SnapshotRestoreWait'] || 60),
            resAnim: Number(parameters['SnapshotRestoreAnim'] || 49)
        }
    };

    // ======================================================================
    // 工具库
    // ======================================================================
    function getBattlerPos(battler) {
        if (!battler) return { x: V2_Params.summon.fallbackX, y: V2_Params.summon.fallbackY };
        if (battler.isEnemy()) {
            return { x: battler.screenX(), y: battler.screenY() };
        } else {
            if ($gameSystem.isSideView()) {
                const index = battler.index();
                return { x: 600 + index * 32, y: 280 + index * 48 };
            } else {
                return { x: 600, y: 400 };
            }
        }
    }

    // ======================================================================
    // 1. 种族光环 (Tribe Bonus)
    // ======================================================================
    const _Game_Enemy_paramRate = Game_Enemy.prototype.paramRate;
    Game_Enemy.prototype.paramRate = function(paramId) {
        let rate = _Game_Enemy_paramRate.call(this, paramId);
        
        const note = this.enemy().note;
        const matches = note.matchAll(/<TribeBonus[:：]\s*(\w+)\s*[,，]\s*(\w+)\s*[,，]\s*(\d+)\s*[,，]\s*([\d\.]+)\s*>/g);
        
        for (const match of matches) {
            const metaKey = match[1];
            const metaVal = match[2];
            const targetParamId = parseInt(match[3]);
            const bonusRate = parseFloat(match[4]);

            if (paramId === targetParamId) {
                const troops = $gameTroop.aliveMembers();
                if (troops.length > 0) {
                    const allMatch = troops.every(member => {
                        const data = member.enemy();
                        return data.meta && data.meta[metaKey] === metaVal;
                    });
                    if (allMatch) {
                        rate *= bonusRate;
                    }
                }
            }
        }
        return rate;
    };

    // ======================================================================
    // 2. 技能效果综合挂钩 (Snapshot / Summon / Custom)
    // ======================================================================
    const _Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        _Game_Action_applyItemUserEffect.call(this, target);
        
        const item = this.item();
        if (!item) return;

        const subject = this.subject();
        const note = item.note;

        // --- 2.1 召唤模块 ---
        const uniqueMatches = note.matchAll(/<SummonUnique[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/g);
        for (const match of uniqueMatches) {
            $gameTroop.requestSummonEnqueue(parseInt(match[1]), true, subject, match[2]?parseInt(match[2]):0);
        }
        const forceMatches = note.matchAll(/<SummonForce[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/g);
        for (const match of forceMatches) {
            $gameTroop.requestSummonEnqueue(parseInt(match[1]), false, subject, match[2]?parseInt(match[2]):0);
        }

        // --- 2.2 快照模块 (Snapshot) ---
        const snapshotMatches = note.matchAll(/<Snapshot[:：]\s*(Record|Restore)\s*[,，]\s*(\w+)\s*>/gi);
        for (const match of snapshotMatches) {
            const mode = match[1].toLowerCase();
            const key = match[2];
            
            if (mode === 'record') {
                target._secSnapshots = target._secSnapshots || {};
                target._secSnapshots[key] = {
                    hp: target.hp,
                    mp: target.mp,
                    tp: target.tp
                };
                if (target.startCustomPopupConfig) {
                    target.startCustomPopupConfig({ 
                        text: V2_Params.snapshot.recText, 
                        color: V2_Params.snapshot.recColor, 
                        style: V2_Params.snapshot.recStyle, 
                        wait: V2_Params.snapshot.recWait 
                    });
                }
            } else if (mode === 'restore') {
                if (target._secSnapshots && target._secSnapshots[key]) {
                    const data = target._secSnapshots[key];
                    if (target.hp < data.hp) {
                        target.setHp(data.hp);
                        target.setMp(data.mp);
                        if (target.startCustomPopupConfig) {
                            target.startCustomPopupConfig({ 
                                text: V2_Params.snapshot.resText, 
                                color: V2_Params.snapshot.resColor, 
                                style: V2_Params.snapshot.resStyle, 
                                wait: V2_Params.snapshot.resWait 
                            });
                        }
                        if (V2_Params.snapshot.resAnim > 0) {
                            $gameTemp.requestAnimation([target], V2_Params.snapshot.resAnim);
                        }
                    }
                }
            }
        }

        // --- 2.3 自定义脚本 (Custom Effect) ---
        const scriptMatches = note.matchAll(/<CustomEffect[:：]\s*(.+)\s*>/gi);
        for (const match of scriptMatches) {
            try {
                const a = subject;
                const b = target;
                const v = $gameVariables;
                eval(match[1]);
            } catch (e) {
                console.error("[Sec_BattleSystemInstanceV2] Custom Script Error:", e);
            }
        }
    };

    // ======================================================================
    // 3. 条件技能 (Conditional Skill)
    // ======================================================================
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function(subject, action, targets) {
        const realSubject = subject || this._subject;
        const realAction = action || (realSubject ? realSubject.currentAction() : null);
        
        if (realAction && realAction.item()) {
            this.processConditionalSkill(realSubject, realAction);
        }
        _BattleManager_startAction.call(this, subject, action, targets);
    };

    BattleManager.processConditionalSkill = function(subject, action) {
        const item = action.item();
        const note = item.note;
        
        // Mode A: ID Check
        const idMatch = note.match(/<ConditionCheck[:：]\s*ids=\[([\d,，\s]+)\]\s*[,，]\s*true=(\d+)\s*[,，]\s*false=(\d+)\s*>/i);
        if (idMatch) {
            const ids = idMatch[1].split(/[,，]/).map(Number);
            const trueSkillId = parseInt(idMatch[2]);
            const falseSkillId = parseInt(idMatch[3]);
            const troops = $gameTroop.aliveMembers();
            const allExist = ids.every(id => troops.some(enemy => enemy.enemyId() === id));
            const targetSkillId = allExist ? trueSkillId : falseSkillId;
            if (targetSkillId > 0) action.setSkill(targetSkillId);
            return;
        }

        // Mode B: Meta Check (Race)
        const metaMatch = note.match(/<ConditionCheck[:：]\s*meta=(\w+)\s*[,，]\s*value=(\w+)\s*[,，]\s*count=(\w+)\s*[,，]\s*true=(\d+)\s*[,，]\s*false=(\d+)\s*>/i);
        if (metaMatch) {
            const metaKey = metaMatch[1];
            const metaVal = metaMatch[2];
            const countMode = metaMatch[3].toLowerCase(); 
            const trueSkillId = parseInt(metaMatch[4]);
            const falseSkillId = parseInt(metaMatch[5]);
            const troops = $gameTroop.aliveMembers();
            
            let conditionMet = false;
            if (countMode === 'all') {
                conditionMet = troops.length > 0 && troops.every(member => member.enemy().meta[metaKey] === metaVal);
            } else {
                conditionMet = troops.some(member => member.enemy().meta[metaKey] === metaVal);
            }

            const targetSkillId = conditionMet ? trueSkillId : falseSkillId;
            if (targetSkillId > 0) action.setSkill(targetSkillId);
        }
    };

    // ======================================================================
    // 4. 状态移除触发 (State Trigger)
    // ======================================================================
    const _Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function(stateId) {
        const isAffected = this.isStateAffected(stateId);
        _Game_Battler_removeState.call(this, stateId);

        if (isAffected) {
            const state = $dataStates[stateId];
            if (state && state.note) {
                const match = state.note.match(/<RemoveTrigger[:：]\s*(\d+)\s*>/);
                if (match) {
                    const skillId = parseInt(match[1]);
                    if (skillId > 0 && this.isAlive()) {
                        this.forceAction(skillId, -1);
                        BattleManager.forceAction(this);
                    }
                }
            }
        }
    };

    // ======================================================================
    // 5. 召唤系统逻辑 (Queue & Position)
    // ======================================================================
    const _Game_Troop_initialize = Game_Troop.prototype.initialize;
    Game_Troop.prototype.initialize = function() {
        _Game_Troop_initialize.call(this);
        this.clearSummonQueue();
    };
    const _Game_Troop_clear = Game_Troop.prototype.clear;
    Game_Troop.prototype.clear = function() {
        _Game_Troop_clear.call(this);
        this.clearSummonQueue();
    };
    Game_Troop.prototype.clearSummonQueue = function() {
        this._secSummonQueue = [];
        this._secSummonTimer = 0;
    };
    Game_Troop.prototype.requestSummonEnqueue = function(enemyId, isUnique, summoner, animId) {
        this._secSummonQueue.push({ enemyId, isUnique, summoner, animId });
    };
    
    // 驱动
    Game_Troop.prototype.updateSecSummon = function() {
        if (this._secSummonTimer > 0) {
            this._secSummonTimer--;
            return;
        }
        if (this._secSummonQueue.length > 0) {
            const req = this._secSummonQueue.shift();
            this.secExecuteSummon(req);
            this._secSummonTimer = V2_Params.summon.interval;
        }
    };

    // 执行
    Game_Troop.prototype.secExecuteSummon = function(req) {
        const { enemyId, isUnique, summoner, animId } = req;
        if (isUnique) {
            const exists = this.members().some(e => e.enemyId() === enemyId && e.isAlive());
            if (exists) return;
        }
        if (this.members().length >= 8) {
            const deadMember = this.members().find(e => e.isDead());
            if (deadMember) this.secReuseEnemy(deadMember, enemyId, summoner, animId);
            return; 
        }
        this.secAddEnemy(enemyId, summoner, animId);
    };

    // 复活/重用
    Game_Troop.prototype.secReuseEnemy = function(enemy, newId, summoner, animId) {
        enemy.transform(newId);
        if (summoner && summoner.isAlive()) {
            const pos = this.calcSummonPos(summoner);
            enemy._screenX = pos.x;
            enemy._screenY = pos.y;
        } else {
             // 召唤者不在，使用默认兜底位置
             enemy._screenX = V2_Params.summon.fallbackX;
             enemy._screenY = V2_Params.summon.fallbackY;
        }
        enemy.setHp(enemy.mhp);
        enemy.setMp(enemy.mmp);
        enemy.setTp(0);
        enemy.removeState(enemy.deathStateId());
        enemy.removeAllBuffs();
        enemy.appear();
        enemy.onBattleStart(); 
        this.makeUniqueNames();
        if (animId > 0) $gameTemp.requestAnimation([enemy], animId);
        this.secTriggerSummonPassive(enemy);
    };

    // 新建
    Game_Troop.prototype.secAddEnemy = function(enemyId, summoner, animId) {
        let x, y;
        if (summoner && summoner.isAlive()) {
            const pos = this.calcSummonPos(summoner);
            x = pos.x;
            y = pos.y;
        } else {
            // 使用自定义的兜底位置
            x = V2_Params.summon.fallbackX + Math.randomInt(100) - 50;
            y = V2_Params.summon.fallbackY + Math.randomInt(100) - 50;
        }
        const enemy = new Game_Enemy(enemyId, x, y);
        enemy.onBattleStart();
        this._enemies.push(enemy);
        this.makeUniqueNames();
        if (SceneManager._scene instanceof Scene_Battle) SceneManager._scene.secAddEnemySprite(enemy);
        if (animId > 0) setTimeout(() => { $gameTemp.requestAnimation([enemy], animId); }, 1);
        this.secTriggerSummonPassive(enemy);
    };

    // 计算位置 (左右交替+递增)
    Game_Troop.prototype.calcSummonPos = function(summoner) {
        if (typeof summoner._secSummonCount === 'undefined') summoner._secSummonCount = 0;
        summoner._secSummonCount++;
        
        const count = summoner._secSummonCount;
        const dir = (count % 2 !== 0) ? -1 : 1; 
        const dist = V2_Params.summon.distX + (count - 1) * V2_Params.summon.distStep;
        const center = getBattlerPos(summoner);
        
        let x = center.x + dir * dist;
        let y = center.y + Math.random() * V2_Params.summon.rangeY; // 向下偏移

        x = x.clamp(50, Graphics.boxWidth - 50);
        y = y.clamp(100, Graphics.boxHeight - 50);
        return { x: Math.round(x), y: Math.round(y) };
    };

    Game_Troop.prototype.secTriggerSummonPassive = function(enemy) {
        const data = enemy.enemy();
        if (data && data.note) {
            const match = data.note.match(/<SummonState[:：]\s*(\d+)\s*>/);
            if (match) enemy.addState(parseInt(match[1]));
        }
    };

    // 驱动
    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);
        if ($gameTroop) $gameTroop.updateSecSummon();
    };

    Scene_Battle.prototype.secAddEnemySprite = function(enemy) {
        if (this._spriteset) this._spriteset.secAddEnemy(enemy);
    };

    Spriteset_Battle.prototype.secAddEnemy = function(enemy) {
        const sprite = new Sprite_Enemy(enemy);
        this._enemySprites.push(sprite);
        this._battleField.addChild(sprite);
        this._enemySprites.sort(this.compareEnemySprite.bind(this));
    };

})();