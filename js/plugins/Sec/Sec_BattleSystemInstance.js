/*:
 * @target MZ
 * @plugindesc [重构版v2.8] 战斗系统实例插件 - 协战修复与正则优化版
 * @author Secmon (Refactored by Gemini)
 * @version 2.8.0
 *
 * @help
 * ============================================================================
 * ★ 插件功能与终极案例手册 v2.8 ★
 * ============================================================================
 * 本插件允许在【职业】、【敌人】或【技能】的备注栏中填写特定标签。
 *
 * 【通用变量表】(所有公式均可用)
 * a    : 动作使用者
 * b    : 动作目标
 * v[n] : 游戏变量
 * s[n] : 游戏开关
 * dmg  : 实际伤害数值
 *
 * ============================================================================
 * 一、被动触发模块 (Passives)
 * ----------------------------------------------------------------------------
 * 位置：职业(Class) 或 敌人(Enemy) 备注
 * ----------------------------------------------------------------------------
 * 1. 普攻/受击特效
 * <战斗触发:Attack, a.gainMp(10)>      // 普攻回蓝
 * <战斗触发:Hit, a.gainTp(10)>         // 受击回怒
 *
 * 2. 亡语机制 (Death Rattle)
 * <战斗触发:Dead, b.addState(10)>      // 死后让凶手中毒
 *
 * ============================================================================
 * 二、技能主动模块 (Active Skills)
 * ----------------------------------------------------------------------------
 * 位置：技能(Skill) 备注
 * ----------------------------------------------------------------------------
 * 1. 溅射伤害: <溅射伤害: 0.5, 1>      // 50%伤害溅射左右各1人
 * 2. 斩杀追击: <斩杀追击: 30, 2000>    // 血量低于30%追加2000伤害
 * 3. 技能吸血: <技能吸血: 0.2>         // 吸血20%
 * 4. 状态交互: <状态交互: 10, a.mat*3, true, Target> // 引爆状态10
 * 5. 力场共鸣: <力场共鸣: 20, Spread, a.mat*2, true> // 全场引爆状态20
 * 6. 伤害转移: <伤害转移: 100, 100, d*0.5, d>        // 帮队友承伤
 * 7. 累计反击: <累计反击: 110, def, 200, d*3>        // 蓄力反击
 * 8. 弹射伤害: <弹射伤害: 3000, damage*0.8, 3, 0, false, Random>
 *
 * ============================================================================
 * 三、全局行动监听模块 (Action Observer) [v2.8 重启]
 * ----------------------------------------------------------------------------
 * 位置：职业(Class) 或 敌人(Enemy) 备注
 * ----------------------------------------------------------------------------
 * 这里的“追击”是指：立即插入一个额外的技能行动，不消耗回合数。
 *
 * 1. 队友协战 (Synergy)
 * ----------------------------------------------------------------------------
 * 描述：当队友行动时，我有概率跟着打一下。
 * 格式：<队友协战: 触发类型, 概率%, 技能ID>
 * 类型：Attack(队友普攻), Skill(队友攻击技能), Support(队友辅助), Any(任意)
 *
 * [案例]
 * // 当队友普攻时，我有30%概率使用“二连击”(技能10)跟刀
 * <队友协战: Attack, 30, 10>
 *
 * ----------------------------------------------------------------------------
 * 2. 敌方识破 (Counter/Reaction)
 * ----------------------------------------------------------------------------
 * 描述：当敌人行动时，我进行反制。
 * 格式：<敌方识破: 触发类型, 概率%, 技能ID>
 * 类型：Support(敌人加Buff/回血), Attack(敌人攻击), Any(任意)
 *
 * [案例]
 * // 当敌人使用辅助技能时，我100%使用“驱散”(技能30)反击他
 * <敌方识破: Support, 100, 30>
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
        _Game_Action_executeDamage.call(this, target, value);

        const subject = this.subject();
        const item = this.item();
        const actualDamage = target.result().hpDamage; 

        // ------------------------------------------------------------------
        // 2.1 【模块 A】 被动机制 (Passives)
        // ------------------------------------------------------------------
        
        // --- A1. 普攻特效 ---
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

        // --- A2. 受击特效 ---
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

        // --- A3. 亡语 ---
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
                        const a = target; 
                        const b = subject; 
                        const v = $gameVariables._data;
                        eval(formula);
                    } catch (e) { console.error(`[Sec] A3 Error`, e); }
                }
             }
        }

        if (!item) return;

        // ------------------------------------------------------------------
        // 2.2 【模块 B】 技能主动机制 (Skill Actives)
        // ------------------------------------------------------------------
        const note = item.note;
        
        // --- B1. 状态交互 ---
        const stateInteractMatches = note.matchAll(/<状态交互:\s*(\d+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^>]+)\s*>/g);
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
        const fieldResMatches = note.matchAll(/<力场共鸣:\s*(\d+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^>]+)\s*>/g);
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

        // --- B3. 溅射伤害 [修复正则与判定] ---
        // 正则现在允许逗号前后有空格: <溅射伤害: 0.5, 1>
        const splashMatch = note.match(/<溅射伤害:\s*([\d\.]+)\s*,\s*(\d+)\s*>/);
        if (splashMatch && actualDamage > 0) {
            const rate = parseFloat(splashMatch[1]);
            const range = parseInt(splashMatch[2]);
            const friends = target.friendsUnit(); 
            const centerIndex = target.index();
            
            // 筛选条件：不同于主目标、存活、已出现(防隐形怪)、索引距离在范围内
            const neighbors = friends.members().filter(member => {
                const idx = member.index();
                return member !== target && 
                       member.isAlive() && 
                       member.isAppeared() && 
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
        const execMatch = note.match(/<斩杀追击:\s*(\d+)\s*,\s*([^>]+)\s*>/);
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
        const drainMatch = note.match(/<技能吸血:\s*([\d\.]+)\s*>/);
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
        const counterMatch = note.match(/<累计反击:\s*(\d+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^>]+)\s*>/);
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
        const dtMatch = note.match(/<伤害转移:\s*(\d+)\s*,\s*([\d\.]+)(?:,\s*([^,>]+)(?:,\s*([^>]+))?)?\s*>/);
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
        const ricochetMatch = note.match(/<弹射伤害:\s*([^,]+)\s*,\s*([^,]+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([^,]+)\s*,\s*([^>]+)\s*>/);
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
                            
                            if (transferInfo.transferFormula) {
                                const a = markerActor; 
                                const b = target;      
                                transferDamage = Math.floor(eval(transferInfo.transferFormula));
                            } else {
                                transferDamage = Math.floor(d * r * (1 + mhp/1000) * (1 - Math.min(0.5, def/1000) - Math.min(0.3, mdef/1000)));
                            }
                            transferDamage = Math.max(1, transferDamage);

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

    // ======================================================================
    // 5. [NEW] 模块 D：全局行动监听器 (Action Observer) [v2.8]
    // ======================================================================
    
    // 监听行动结束时刻
    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        const triggerSubject = this._subject;
        const triggerAction = this._action;
        
        // 执行原版逻辑
        _BattleManager_endAction.call(this);

        // 如果本次行动有效，且不是递归调用(防止死循环)，则广播信号
        if (triggerSubject && triggerAction && !this._isRecursiveForce) {
            // 标记递归锁，防止协战触发协战
            this._isRecursiveForce = true;
            this.broadcastActionSignal(triggerSubject, triggerAction);
            this._isRecursiveForce = false;
        }
    };

    /**
     * 向全场广播行动信号，寻找响应者
     */
    BattleManager.broadcastActionSignal = function(source, action) {
        const allMembers = $gameParty.members().concat($gameTroop.members());
        
        // 简单处理：按队列顺序触发
        for (const observer of allMembers) {
            // 排除死者和行动者自己
            if (!observer.isAlive() || observer === source) continue;
            
            // D1. 队友协战: 观察者与源是队友
            if (observer.friendsUnit() === source.friendsUnit()) {
                this.checkSynergy(observer, source, action);
            }
            
            // D2. 敌方识破: 观察者与源是敌人
            if (observer.friendsUnit() !== source.friendsUnit()) {
                this.checkReaction(observer, source, action);
            }
        }
    };

    /**
     * 检查协战逻辑 (Synergy)
     */
    BattleManager.checkSynergy = function(observer, source, action) {
        let note = "";
        if (observer.isActor()) {
            const c = observer.currentClass();
            if (c) note = c.note;
        } else {
            const e = observer.enemy();
            if (e) note = e.note;
        }

        // 正则优化：允许逗号前后的空格
        const matches = note.matchAll(/<队友协战:\s*([^,]+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any') matchType = true;
            else if (type === 'attack' && action.isAttack()) matchType = true;
            else if (type === 'skill' && action.isSkill() && !action.isAttack()) matchType = true;
            else if (type === 'support' && (action.isForFriend() || action.isRecover())) matchType = true;

            if (matchType && Math.random() * 100 < chance) {
                // 协战跟随：-2 代表“上一个行动的目标”，即跟随队友打同一个怪
                observer.forceAction(skillId, -2);
                return; // 一次只触发一个
            }
        }
    };

    /**
     * 检查识破逻辑 (Reaction)
     */
    BattleManager.checkReaction = function(observer, source, action) {
        let note = "";
        if (observer.isActor()) {
            const c = observer.currentClass();
            if (c) note = c.note;
        } else {
            const e = observer.enemy();
            if (e) note = e.note;
        }

        const matches = note.matchAll(/<敌方识破:\s*([^,]+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any') matchType = true;
            // 判断是否是“辅助自己/队友”的行为
            if (type === 'support' && (action.isForFriend() || action.isRecover())) matchType = true;
            // 判断是否是“攻击我方”的行为
            else if (type === 'attack' && action.isForOpponent()) matchType = true;

            if (matchType && Math.random() * 100 < chance) {
                // 智能锁定逻辑：
                // 如果我的反制技能是攻击性的（对敌方），强制锁定 source (谁惹我我打谁)
                // 如果我的反制技能是增益性的（对自己），锁定 observer (给自己加buff)
                const reactionSkill = $dataSkills[skillId];
                let targetIndex = -2;

                if (reactionSkill) {
                     // 范围 1~6 是敌方单体/全体/随机
                     if ([1, 2, 3, 4, 5, 6].includes(reactionSkill.scope)) {
                         targetIndex = source.index(); // 锁定那个敌人
                     } else {
                         targetIndex = observer.index(); // 锁定自己
                     }
                }
                
                observer.forceAction(skillId, targetIndex);
                return;
            }
        }
    };

})();