/*:
 * @target MZ
 * @plugindesc [战斗] Boss机制工具箱：召唤/回溯/种族/脚本 (v2.0 终极版)
 * @author Secmon (Mechanics)
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 * @orderBefore Sec_BattleVisuals
 *
 * @help
 * ============================================================================
 * Sec_BossMechanics.js (v2.0)
 * ============================================================================
 * 本插件专为实现复杂Boss机制设计，整合了召唤、时间回溯、条件技能和脚本执行。
 * * 【功能模块索引】
 * 1. 召唤系统 (Summon)     -> 用于“阴阳两隔”等召唤技能
 * 2. 状态亡语 (Trigger)    -> 用于“钻地”结束后的突袭、“和光同尘”的回溯触发
 * 3. 条件技能 (Condition)  -> 用于根据场上小怪情况切换技能
 * 4. 快照系统 (Snapshot)   -> 用于“和光同尘”记录和恢复血量
 * 5. 脚本特效 (Custom)     -> 用于“巫狼”给特定种族加Buff
 * 6. 种族光环 (Tribe)      -> 用于“暗黑体质”全场检测加成
 *
 * ============================================================================
 * 【1. 召唤系统】(技能备注)
 * <SummonUnique: id, anim>  - 唯一召唤 (场上没有才召)
 * <SummonForce: id, anim>   - 强制召唤 (填满为止)
 * * 示例: <SummonForce: 10, 120> (召唤10号敌人，播放120号动画)
 *
 * 【2. 状态亡语】(状态备注)
 * <RemoveTrigger: skillId>
 * - 当状态消失/被驱散时，强制持有者释放技能。
 * * 示例: <RemoveTrigger: 88> (状态结束后释放88号技能)
 *
 * 【3. 条件技能】(技能备注)
 * <ConditionCheck: meta=Race, value=Dark, count=All, true=X, false=Y>
 * - 检测场上敌人是否符合条件，符合放技能X，否则放Y。
 *
 * 【4. 快照系统】(技能备注 - 用于时间回溯)
 * <Snapshot: Record, Key>
 * - 记录当前 HP/MP/TP 到 Key 槽位。
 * <Snapshot: Restore, Key>
 * - 读取 Key 槽位的数据。如果不满(当前<记录)，则回溯恢复。
 * * 示例: "和光同尘"先 Record，4回合后的触发技 Restore。
 *
 * 【5. 脚本特效】(技能备注 - 用于复杂逻辑)
 * <CustomEffect: JS代码>
 * - 在技能生效时执行一段JS代码。变量 b 代表目标。
 * * 示例(巫狼吼叫): <CustomEffect: if(b.enemy().meta.Race === 'Animal') b.addBuff(2, 3)>
 *
 * 【6. 种族光环】(敌人备注 - 用于暗黑体质)
 * <TribeBonus: metaKey, metaVal, paramId, rate>
 * - 当场上【所有】敌人都具有 <metaKey: metaVal> 标签时，自身属性 paramId 提升 rate 倍。
 * - paramId: 2=攻, 3=防, 4=魔攻, 5=魔防, 6=敏, 7=运, 0=MHP
 * * 示例: <TribeBonus: Race, Dark, 2, 1.5> (全员Dark族时，攻击力1.5倍)
 *
 * ============================================================================
 * @param ---Summon Settings---
 * @text [召唤] 位置设置
 * @default
 *
 * @param SummonInterval
 * @parent ---Summon Settings---
 * @text 召唤间隔(帧)
 * @type number
 * @default 30
 *
 * @param SummonDistanceX
 * @parent ---Summon Settings---
 * @text 初始水平间距
 * @type number
 * @default 120
 *
 * @param SummonDistanceStep
 * @parent ---Summon Settings---
 * @text 距离递增值
 * @type number
 * @default 40
 *
 * @param SummonRangeY
 * @parent ---Summon Settings---
 * @text 向下随机范围
 * @type number
 * @default 60
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_BossMechanics";
    const parameters = PluginManager.parameters(pluginName);

    const SUMMON_INTERVAL = Number(parameters['SummonInterval'] || 30);
    const SUMMON_DIST_X = Number(parameters['SummonDistanceX'] || 120);
    const SUMMON_DIST_STEP = Number(parameters['SummonDistanceStep'] || 40);
    const SUMMON_RANGE_Y = Number(parameters['SummonRangeY'] || 60);

    // ======================================================================
    // 工具库
    // ======================================================================
    function getBattlerPos(battler) {
        if (!battler) return { x: 600, y: 300 };
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
    // 1. 种族光环 (Tribe Bonus) - 核心属性挂钩
    // ======================================================================
    const _Game_Enemy_paramRate = Game_Enemy.prototype.paramRate;
    Game_Enemy.prototype.paramRate = function(paramId) {
        let rate = _Game_Enemy_paramRate.call(this, paramId);
        
        // 读取敌人备注中的光环设置
        const note = this.enemy().note;
        // <TribeBonus: Race, Dark, 2, 1.5>
        const matches = note.matchAll(/<TribeBonus[:：]\s*(\w+)\s*[,，]\s*(\w+)\s*[,，]\s*(\d+)\s*[,，]\s*([\d\.]+)\s*>/g);
        
        for (const match of matches) {
            const metaKey = match[1];
            const metaVal = match[2];
            const targetParamId = parseInt(match[3]);
            const bonusRate = parseFloat(match[4]);

            // 只处理当前请求的属性ID
            if (paramId === targetParamId) {
                // 检查全场条件
                const troops = $gameTroop.aliveMembers();
                const allMatch = troops.every(member => {
                    const data = member.enemy();
                    return data.meta && data.meta[metaKey] === metaVal;
                });

                if (allMatch) {
                    rate *= bonusRate;
                }
            }
        }
        return rate;
    };

    // ======================================================================
    // 2. 技能效果扩展 (Snapshot & Custom Script)
    // ======================================================================
    const _Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        _Game_Action_applyItemUserEffect.call(this, target);
        
        const item = this.item();
        if (!item) return;

        const subject = this.subject();
        const note = item.note;

        // --- 召唤模块 ---
        const uniqueMatches = note.matchAll(/<SummonUnique[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/g);
        for (const match of uniqueMatches) {
            $gameTroop.requestSummonEnqueue(parseInt(match[1]), true, subject, match[2]?parseInt(match[2]):0);
        }
        const forceMatches = note.matchAll(/<SummonForce[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/g);
        for (const match of forceMatches) {
            $gameTroop.requestSummonEnqueue(parseInt(match[1]), false, subject, match[2]?parseInt(match[2]):0);
        }

        // --- 快照模块 (Snapshot) ---
        // <Snapshot: Record, Slot1>
        const snapshotMatches = note.matchAll(/<Snapshot[:：]\s*(Record|Restore)\s*[,，]\s*(\w+)\s*>/gi);
        for (const match of snapshotMatches) {
            const mode = match[1].toLowerCase();
            const key = match[2];
            
            // 记录 (绑定在 target 身上，通常 target=self)
            if (mode === 'record') {
                target._secSnapshots = target._secSnapshots || {};
                target._secSnapshots[key] = {
                    hp: target.hp,
                    mp: target.mp,
                    tp: target.tp
                };
                // 视觉反馈
                if (target.startCustomPopupConfig) {
                    target.startCustomPopupConfig({ text: "Time Anchor", color: "#88AAFF", style: "pulse", wait: 40 });
                }
            } 
            // 恢复
            else if (mode === 'restore') {
                if (target._secSnapshots && target._secSnapshots[key]) {
                    const data = target._secSnapshots[key];
                    // 仅当当前血量低于记录时才回溯 (根据文档需求)
                    if (target.hp < data.hp) {
                        target.setHp(data.hp);
                        target.setMp(data.mp); // 蓝量是否回溯视需求而定，这里一并回溯
                        // target.setTp(data.tp); // TP通常不回溯
                        if (target.startCustomPopupConfig) {
                            target.startCustomPopupConfig({ text: "Time Revert", color: "#FFFFFF", style: "rise", wait: 60 });
                        }
                        // 播放一个通用的回复动画
                        $gameTemp.requestAnimation([target], 49); 
                    }
                }
            }
        }

        // --- 自定义脚本模块 (Custom Effect) ---
        // <CustomEffect: if(b.hp>0) b.gainHp(-100)>
        // 变量: a=subject, b=target, v=$gameVariables
        const scriptMatches = note.matchAll(/<CustomEffect[:：]\s*(.+)\s*>/gi);
        for (const match of scriptMatches) {
            try {
                const a = subject;
                const b = target;
                const v = $gameVariables;
                eval(match[1]);
            } catch (e) {
                console.error("Sec_BossMechanics CustomEffect Error:", e);
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
        
        // ID 检测
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

        // Meta 检测 (种族检测)
        const metaMatch = note.match(/<ConditionCheck[:：]\s*meta=(\w+)\s*[,，]\s*value=(\w+)\s*[,，]\s*count=(\w+)\s*[,，]\s*true=(\d+)\s*[,，]\s*false=(\d+)\s*>/i);
        if (metaMatch) {
            const metaKey = metaMatch[1];
            const metaVal = metaMatch[2];
            const countMode = metaMatch[3].toLowerCase(); // all or any
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
    // 4. 状态移除触发
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
    // 5. 召唤系统逻辑
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
    Game_Troop.prototype.updateSecSummon = function() {
        if (this._secSummonTimer > 0) {
            this._secSummonTimer--;
            return;
        }
        if (this._secSummonQueue.length > 0) {
            const req = this._secSummonQueue.shift();
            this.secExecuteSummon(req);
            this._secSummonTimer = SUMMON_INTERVAL;
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
            x = 100 + Math.randomInt(600);
            y = 250 + Math.randomInt(200);
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
        const dist = SUMMON_DIST_X + (count - 1) * SUMMON_DIST_STEP;
        const center = getBattlerPos(summoner);
        let x = center.x + dir * dist;
        let y = center.y + Math.random() * SUMMON_RANGE_Y;
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

})();