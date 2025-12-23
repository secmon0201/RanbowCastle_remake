/*:
 * @target MZ
 * @plugindesc [战斗] 核心机制扩展包 V2：召唤/回溯/种族/脚本 (v2.3 修复召唤版)
 * @author Secmon (Mechanics V2)
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 * @orderBefore Sec_BattleVisuals
 *
 * @help
 * ============================================================================
 * Sec_BattleSystemInstanceV2.js (v2.3)
 * ============================================================================
 * 【修复日志 v2.3】
 * 1. [修复] 补全了 <SummonForce> 和 <SummonUnique> 的解析逻辑。
 * 之前版本虽然定义了召唤功能，但忘记在技能释放时读取标签，导致召唤无效。
 * 2. [安全] 保持了 v2.2 的 RemoveTrigger 安全锁和 CustomEffect 容错。
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

    // 1. 种族光环
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

    // 2. 全局效果挂钩 (Summon & Snapshot)
    const _Game_Action_applyGlobal = Game_Action.prototype.applyGlobal;
    Game_Action.prototype.applyGlobal = function() {
        _Game_Action_applyGlobal.call(this);
        
        const item = this.item();
        if (!item) return;

        const subject = this.subject();
        const note = item.note;

        // --- 快照模块 (Snapshot) ---
        const snapshotMatches = note.matchAll(/<Snapshot[:：]\s*(Record|Restore)\s*[,，]\s*(\w+)\s*>/gi);
        for (const match of snapshotMatches) {
            const mode = match[1].toLowerCase();
            const key = match[2];
            if (mode === 'record') {
                subject._secSnapshots = subject._secSnapshots || {};
                subject._secSnapshots[key] = { hp: subject.hp, mp: subject.mp, tp: subject.tp };
                if (subject.startCustomPopupConfig) {
                    subject.startCustomPopupConfig({ 
                        text: V2_Params.snapshot.recText, 
                        color: V2_Params.snapshot.recColor, 
                        style: V2_Params.snapshot.recStyle, 
                        wait: V2_Params.snapshot.recWait 
                    });
                }
            } else if (mode === 'restore') {
                if (subject._secSnapshots && subject._secSnapshots[key]) {
                    const data = subject._secSnapshots[key];
                    if (subject.hp < data.hp) {
                        subject.setHp(data.hp);
                        subject.setMp(data.mp);
                        if (subject.startCustomPopupConfig) {
                            subject.startCustomPopupConfig({ 
                                text: V2_Params.snapshot.resText, 
                                color: V2_Params.snapshot.resColor, 
                                style: V2_Params.snapshot.resStyle, 
                                wait: V2_Params.snapshot.resWait 
                            });
                        }
                        if (V2_Params.snapshot.resAnim > 0) {
                            $gameTemp.requestAnimation([subject], V2_Params.snapshot.resAnim);
                        }
                    }
                }
            }
        }

        // --- [修复] 召唤模块 (Summon) ---
        // 之前版本这里缺失了代码，导致技能无法触发召唤
        const summonUniqueMatches = note.matchAll(/<SummonUnique[:：]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of summonUniqueMatches) {
            const enemyId = parseInt(match[1]);
            const animId = parseInt(match[2]);
            $gameTroop.requestSummonEnqueue(enemyId, true, subject, animId);
        }

        const summonForceMatches = note.matchAll(/<SummonForce[:：]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of summonForceMatches) {
            const enemyId = parseInt(match[1]);
            const animId = parseInt(match[2]);
            $gameTroop.requestSummonEnqueue(enemyId, false, subject, animId);
        }
    };

    // 3. 目标效果挂钩 (Custom Effect)
    const _Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        _Game_Action_applyItemUserEffect.call(this, target);
        const item = this.item();
        if (!item) return;
        const subject = this.subject();
        const scriptMatches = item.note.matchAll(/<CustomEffect[:：]\s*([\s\S]+?)\s*>/gi);
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

    // 4. 条件技能
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

    // 5. 状态移除触发 (安全加强)
    const _Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function(stateId) {
        const isAffected = this.isStateAffected(stateId);
        _Game_Battler_removeState.call(this, stateId);
        if (isAffected && $gameParty.inBattle()) {
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

    // 6. 召唤系统逻辑
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

    Game_Troop.prototype.secReuseEnemy = function(enemy, newId, summoner, animId) {
        enemy.transform(newId);
        if (summoner && summoner.isAlive()) {
            const pos = this.calcSummonPos(summoner);
            enemy._screenX = pos.x;
            enemy._screenY = pos.y;
        } else {
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

    Game_Troop.prototype.secAddEnemy = function(enemyId, summoner, animId) {
        let x, y;
        if (summoner && summoner.isAlive()) {
            const pos = this.calcSummonPos(summoner);
            x = pos.x;
            y = pos.y;
        } else {
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

    Game_Troop.prototype.calcSummonPos = function(summoner) {
        if (typeof summoner._secSummonCount === 'undefined') summoner._secSummonCount = 0;
        summoner._secSummonCount++;
        const count = summoner._secSummonCount;
        const dir = (count % 2 !== 0) ? -1 : 1; 
        const dist = V2_Params.summon.distX + (count - 1) * V2_Params.summon.distStep;
        const center = getBattlerPos(summoner);
        let x = center.x + dir * dist;
        let y = center.y + Math.random() * V2_Params.summon.rangeY; 
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

    // ======================================================================
    // 7. [Fix v5.1] 强制行动安全锁 (防止角色在强制行动前死亡导致报错)
    // ======================================================================
    const _BattleManager_processForcedAction = BattleManager.processForcedAction;
    BattleManager.processForcedAction = function() {
        // 检查是否存在强制行动的角色
        if (this._actionForcedBattler) {
            const battler = this._actionForcedBattler;
            
            // 安全检查 1: 角色是否已经没有任何行动？(通常是因为中途死亡被 clearActions 了)
            // 安全检查 2: 角色是否无法行动？
            if (!battler.currentAction() || !battler.canMove()) {
                // console.log("Sec_Fix: 拦截了一次无效的强制行动，目标可能已死亡。", battler.name());
                
                // 清除强制标志，防止死循环或逻辑卡死
                this._actionForcedBattler = null;
                this._subject = null;
                
                // 如果是 TPB 模式，可能需要重置一下状态防止卡条
                if (this.isTpb() && battler.onTpbTimeout) {
                    battler.onTpbTimeout(); 
                }
                return; // 直接中断，不再调用核心方法
            }
        }
        
        // 只有通过检查才执行原逻辑
        _BattleManager_processForcedAction.call(this);
    };
    
})();