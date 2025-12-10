/*:
 * @target MZ
 * @plugindesc [战斗] Boss机制扩展：召唤/状态触发/条件技能 (v1.6 召唤图层优化)
 * @author Secmon (Mechanics)
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 * @orderBefore Sec_BattleVisuals
 *
 * @help
 * ============================================================================
 * Sec_BossMechanics.js (v1.6)
 * ============================================================================
 * 这是一个专为 Boss 设计的机制扩展插件。
 * 需放置在 Sec_BattleSystemInstance 和 Sec_BattleVisuals 之间。
 *
 * 【更新日志 v1.6】
 * 1. [优化] 召唤位置 Y 轴逻辑调整：
 * 为了保证遮挡关系正确（新召唤的单位图层在旧单位之上），
 * 新召唤的单位现在永远位于召唤者（Boss）的下方（Y轴更大）。
 * SummonRangeY 现在代表向下的随机偏移量。
 *
 * 【功能说明】
 *
 * 1. 召唤类主动技能 (写在技能备注)
 * 格式：<标签: 敌人ID, 动画ID> (动画ID可选，不填则无动画)
 *
 * <SummonUnique: enemyId, animId>
 * - 检查场上是否存在该 enemyId 的敌人(活体)。
 * - 如果不存在，则召唤该敌人并播放 animId 动画。
 * - 示例: <SummonUnique: 10, 66> (召唤10号敌人，播放66号动画)
 *
 * <SummonForce: enemyId, animId>
 * - 强制召唤该 enemyId 的敌人，直到场上敌人总数达到 8 人上限。
 * - 示例: <SummonForce: 11> (召唤11号敌人，不播放动画)
 *
 * 2. 被动型技能 (写在敌人备注)
 * <SummonState: stateId>
 * - 该敌人被“召唤”出场时，立即获得指定状态。
 *
 * 3. 状态型技能 (写在状态备注)
 * <RemoveTrigger: skillId>
 * - 当持有该状态的单位移除该状态时（自然消失或驱散），强制释放技能。
 *
 * 4. 主动型检测技能 (写在技能备注)
 * <ConditionCheck: ids=[a,b,...], true=x, false=y>
 * - ids: 检测敌人ID列表。
 * - true: 全都在场时释放的技能ID。
 * - false: 否则释放的技能ID。
 *
 * ============================================================================
 * @param ---Summon Settings---
 * @text [召唤] 表现设置
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
 * @desc 召唤物在 Y 轴上相对于召唤者的向下随机偏移量（保证图层在召唤者之上）。
 * @type number
 * @default 60
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_BossMechanics";
    const parameters = PluginManager.parameters(pluginName);

    // 召唤参数
    const SUMMON_INTERVAL = Number(parameters['SummonInterval'] || 30);
    const SUMMON_DIST_X = Number(parameters['SummonDistanceX'] || 120);
    const SUMMON_DIST_STEP = Number(parameters['SummonDistanceStep'] || 40);
    const SUMMON_RANGE_Y = Number(parameters['SummonRangeY'] || 60);

    // ======================================================================
    // 工具：获取战斗单位坐标
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
    // Game_Troop 扩展：召唤队列
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

    // 加入队列
    Game_Troop.prototype.requestSummonEnqueue = function(enemyId, isUnique, summoner, animId) {
        this._secSummonQueue.push({
            enemyId: enemyId,
            isUnique: isUnique,
            summoner: summoner,
            animId: animId
        });
    };

    // 队列更新 (由 BattleManager 驱动)
    Game_Troop.prototype.updateSecSummon = function() {
        if (this._secSummonTimer > 0) {
            this._secSummonTimer--;
            return;
        }
        
        if (this._secSummonQueue.length > 0) {
            const req = this._secSummonQueue.shift();
            // 执行实际召唤逻辑
            this.secExecuteSummon(req);
            // 重置冷却时间
            this._secSummonTimer = SUMMON_INTERVAL;
        }
    };

    // 执行单次召唤
    Game_Troop.prototype.secExecuteSummon = function(req) {
        const { enemyId, isUnique, summoner, animId } = req;

        // 1. 检查唯一性
        if (isUnique) {
            const exists = this.members().some(e => e.enemyId() === enemyId && e.isAlive());
            if (exists) return;
        }

        // 2. 检查人数上限
        if (this.members().length >= 8) {
            // 复用尸体
            const deadMember = this.members().find(e => e.isDead());
            if (deadMember) {
                this.secReuseEnemy(deadMember, enemyId, summoner, animId);
            }
            return; 
        }

        // 3. 新增敌人
        this.secAddEnemy(enemyId, summoner, animId);
    };

    // 复用尸体
    Game_Troop.prototype.secReuseEnemy = function(enemy, newId, summoner, animId) {
        enemy.transform(newId);
        
        // 重置位置
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
        
        // 播放动画
        if (animId > 0) {
            $gameTemp.requestAnimation([enemy], animId);
        }

        this.secTriggerSummonPassive(enemy);
    };

    // 新增敌人
    Game_Troop.prototype.secAddEnemy = function(enemyId, summoner, animId) {
        let x, y;
        if (summoner && summoner.isAlive()) {
            const pos = this.calcSummonPos(summoner);
            x = pos.x;
            y = pos.y;
        } else {
            // 兜底随机 (如果召唤者死了)
            x = 100 + Math.randomInt(600);
            y = 250 + Math.randomInt(200);
        }

        const enemy = new Game_Enemy(enemyId, x, y);
        enemy.onBattleStart();
        this._enemies.push(enemy);
        this.makeUniqueNames();

        if (SceneManager._scene instanceof Scene_Battle) {
            SceneManager._scene.secAddEnemySprite(enemy);
        }

        // 播放动画
        if (animId > 0) {
            // 稍作延迟以确保 Sprite 已创建
            setTimeout(() => {
                $gameTemp.requestAnimation([enemy], animId);
            }, 1);
        }

        this.secTriggerSummonPassive(enemy);
    };

    // 计算位置 (左右交替 + 距离递增 + 仅向下偏移)
    Game_Troop.prototype.calcSummonPos = function(summoner) {
        if (typeof summoner._secSummonCount === 'undefined') {
            summoner._secSummonCount = 0;
        }
        summoner._secSummonCount++;
        
        const count = summoner._secSummonCount;
        // 左右交替 (-1, 1, -1, 1...)
        const dir = (count % 2 !== 0) ? -1 : 1; 
        // 距离递增
        const dist = SUMMON_DIST_X + (count - 1) * SUMMON_DIST_STEP;

        const center = getBattlerPos(summoner);
        
        let x = center.x + dir * dist;
        // [v1.6] 仅向下偏移 (保证召唤物在 Boss 前面/下方)
        let y = center.y + Math.random() * SUMMON_RANGE_Y;

        x = x.clamp(50, Graphics.boxWidth - 50);
        y = y.clamp(100, Graphics.boxHeight - 50);

        return { x: Math.round(x), y: Math.round(y) };
    };

    Game_Troop.prototype.secTriggerSummonPassive = function(enemy) {
        const data = enemy.enemy();
        if (data && data.note) {
            const match = data.note.match(/<SummonState[:：]\s*(\d+)\s*>/);
            if (match) {
                const stateId = parseInt(match[1]);
                enemy.addState(stateId);
            }
        }
    };

    // ======================================================================
    // 1. 条件技能
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
        const match = note.match(/<ConditionCheck[:：]\s*ids=\[([\d,，\s]+)\]\s*[,，]\s*true=(\d+)\s*[,，]\s*false=(\d+)\s*>/i);
        
        if (match) {
            const ids = match[1].split(/[,，]/).map(Number);
            const trueSkillId = parseInt(match[2]);
            const falseSkillId = parseInt(match[3]);

            const troops = $gameTroop.aliveMembers();
            const allExist = ids.every(id => troops.some(enemy => enemy.enemyId() === id));

            const targetSkillId = allExist ? trueSkillId : falseSkillId;
            
            if (targetSkillId > 0) {
                action.setSkill(targetSkillId);
            }
        }
    };

    // ======================================================================
    // 2. 状态移除触发
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
    // 3. 召唤系统 - 技能挂钩
    // ======================================================================
    const _Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        _Game_Action_applyItemUserEffect.call(this, target);
        
        const item = this.item();
        if (!item) return;

        const subject = this.subject();

        // 匹配 Unique 召唤
        const uniqueMatches = item.note.matchAll(/<SummonUnique[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/g);
        for (const match of uniqueMatches) {
            const enemyId = parseInt(match[1]);
            const animId = match[2] ? parseInt(match[2]) : 0;
            $gameTroop.requestSummonEnqueue(enemyId, true, subject, animId);
        }

        // 匹配 Force 召唤
        const forceMatches = item.note.matchAll(/<SummonForce[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/g);
        for (const match of forceMatches) {
            const enemyId = parseInt(match[1]);
            const animId = match[2] ? parseInt(match[2]) : 0;
            $gameTroop.requestSummonEnqueue(enemyId, false, subject, animId);
        }
    };

    // ======================================================================
    // BattleManager 更新循环挂钩
    // ======================================================================
    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);
        // 驱动召唤队列
        if ($gameTroop) {
            $gameTroop.updateSecSummon();
        }
    };

    // ======================================================================
    // 4. 精灵图动态创建
    // ======================================================================
    Scene_Battle.prototype.secAddEnemySprite = function(enemy) {
        if (this._spriteset) {
            this._spriteset.secAddEnemy(enemy);
        }
    };

    Spriteset_Battle.prototype.secAddEnemy = function(enemy) {
        const sprite = new Sprite_Enemy(enemy);
        this._enemySprites.push(sprite);
        this._battleField.addChild(sprite);
        this._enemySprites.sort(this.compareEnemySprite.bind(this));
    };

})();