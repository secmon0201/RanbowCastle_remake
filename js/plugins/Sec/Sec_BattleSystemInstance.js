/*:
 * @target MZ
 * @plugindesc [重构版v2.9] 战斗系统实例插件 - 正则兼容与功能修复版
 * @author Secmon (Refactored by Gemini)
 * @version 2.9.0
 *
 * @help
 * ============================================================================
 * ★ 插件功能手册 v2.9 (修复版) ★
 * ============================================================================
 * 【更新说明】
 * v2.9: 
 * 1. 修复了溅射伤害因标点/空格问题无法触发的Bug。
 * 2. 现在所有标签均支持中文标点(：，)和英文标点(:, )。
 * 3. 补全了v2.6版本缺失的“协战/识破”监听模块。
 *
 * 【标签写法宽容度提升】
 * 以下写法均可识别：
 * <溅射伤害:0.5,1>      (紧凑)
 * <溅射伤害: 0.5, 1>    (标准)
 * <溅射伤害：0.5，1>    (中文标点)
 *
 * ============================================================================
 * 一、被动触发模块 (Passives)
 * 位置：职业(Class) 或 敌人(Enemy) 备注
 * ----------------------------------------------------------------------------
 * 1. 普攻/受击特效
 * <战斗触发:Attack, a.gainMp(10)>
 * <战斗触发:Hit, a.gainTp(10)>
 *
 * 2. 亡语机制(目前无效)
 * <战斗触发:Dead, b.addState(10)>
 *
 * ============================================================================
 * 二、技能主动模块 (Active Skills)
 * 位置：技能(Skill) 备注
 * ----------------------------------------------------------------------------
 * 1. 溅射伤害: <溅射伤害: 比例, 范围>(目前无效)
 * 例: <溅射伤害: 0.5, 1>
 *
 * 2. 斩杀追击: <斩杀追击: 阈值%, 公式>
 * 例: <斩杀追击: 30, 2000>
 *
 * 3. 技能吸血: <技能吸血: 比例>
 * 例: <技能吸血: 0.2>
 *
 * 4. 状态交互: <状态交互: 状态ID, 公式, 移除?, 范围>
 * 例: <状态交互: 10, a.mat*3, true, Target>
 *
 * 5. 力场共鸣: <力场共鸣: 状态ID, 模式, 公式, 移除?>
 * 例: <力场共鸣: 20, Spread, a.mat*2, true>
 *
 * 6. 伤害转移: <伤害转移: 状态ID, 比例%, 转移公式, 恢复公式>
 * 例: <伤害转移: 100, 100, d*0.5, d>
 *
 * 7. 累计反击: <累计反击: 状态ID, 属性, 值, 反击公式>
 * 例: <累计反击: 110, def, 200, d*3>
 *
 * 8. 弹射伤害: <弹射伤害: 初始, 递推, 次数, 上限, 重复?, 模式>
 * 例: <弹射伤害: 3000, damage*0.8, 3, 0, false, Random>
 *
 * ============================================================================
 * 三、全局行动监听模块 (Action Observer)
 * 位置：职业(Class) 或 敌人(Enemy) 备注
 * ----------------------------------------------------------------------------
 * 1. 队友协战: <队友协战: 触发类型, 概率%, 技能ID>(目前无效)
 * 类型: Attack, Skill, Support, Any
 * 例: <队友协战: Attack, 30, 10>
 *
 * 2. 敌方识破: <敌方识破: 触发类型, 概率%, 技能ID>(目前无效)
 * 类型: Support, Attack, Any
 * 例: <敌方识破: Support, 100, 30>
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginName = "BattleSystemInstance";

    // ======================================================================
    // 【新增】辅助函数：获取战斗者所有的备注内容 (角色+职业+所有装备)
    // ======================================================================
    function _Sec_GetBattlerNotes(battler) {
        let notes = "";
        if (battler.isActor()) {
            // 1. 角色本身备注
            notes += (battler.actor().note || "") + "\n";
            // 2. 职业备注
            if (battler.currentClass()) {
                notes += (battler.currentClass().note || "") + "\n";
            }
            // 3. 所有装备备注 (武器 + 防具)
            battler.equips().forEach(item => {
                if (item) {
                    notes += (item.note || "") + "\n";
                }
            });
        } else if (battler.isEnemy()) {
            // 敌人备注
            const enemy = battler.enemy();
            if (enemy) {
                notes += (enemy.note || "") + "\n";
            }
        }
        return notes;
    }

    // ======================================================================
    // 1. 全局数据存储
    // ======================================================================
    const _Sec_AccumulatedDamage = new Map();
    const _Sec_TransferMarker = new Map();



    // ======================================================================
    // 2. 核心逻辑挂钩：Game_Action.prototype.executeDamage (v2.9.6 装备兼容版)
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        
        // 记录受击前的死亡状态
        const wasDead = target.isDead();

        // 执行原版逻辑
        _Game_Action_executeDamage.call(this, target, value);

        const subject = this.subject();
        const item = this.item();
        const actualDamage = target.result().hpDamage; 

        // ------------------------------------------------------------------
        // 2.1 【模块 A】 被动机制 (已升级：读取装备备注)
        // ------------------------------------------------------------------
        
        // --- A1. 攻击特效 (Attack) ---
        // 只要是攻击，就读取“凶手”身上的所有备注(含装备)
        if (subject && this.isAttack()) {
            const noteData = _Sec_GetBattlerNotes(subject);
            if (noteData) {
                const matches = noteData.matchAll(/<战斗触发[:：]\s*Attack\s*[,，]\s*([^>]+)>/gi);
                for (const match of matches) {
                    const formula = match[1].trim();
                    try {
                        const a = subject, b = target, v = $gameVariables._data;
                        if (formula.includes('gainMp')) subject._ignoreMpLog = true;
                        eval(formula);
                        subject._ignoreMpLog = false;
                    } catch (e) { console.error(`[Sec] A1 Error`, e); }
                }
            }
        }

        // --- A2. 受击特效 (Hit) ---
        // 只要受击，就读取“受害者”身上的所有备注(含装备)
        if (target) {
            const result = target.result();
            if (result.isHit() || actualDamage > 0) {
                const noteData = _Sec_GetBattlerNotes(target);
                if (noteData) {
                    const matches = noteData.matchAll(/<战斗触发[:：]\s*Hit\s*[,，]\s*([^>]+)>/gi);
                    for (const match of matches) {
                        const formula = match[1].trim();
                        try {
                            const a = target, b = subject, v = $gameVariables._data;
                            if (formula.includes('gainMp')) target._ignoreMpLog = true;
                            eval(formula);
                            target._ignoreMpLog = false;
                        } catch (e) { console.error(`[Sec] A2 Error`, e); }
                    }
                }
            }
        }

        // --- A3. 亡语 (Dead) ---
        if (target && !wasDead && target.isDead()) {
             // 读取死者身上的所有备注(含装备)
             const noteData = _Sec_GetBattlerNotes(target);

             if (noteData) {
                const matches = noteData.matchAll(/<战斗触发[:：]\s*Dead\s*[,，]\s*([^>]+)>/gi);
                for (const match of matches) {
                    const formula = match[1].trim();
                    try {
                        const a = target, b = subject, v = $gameVariables._data, dmg = actualDamage;
                        console.log(`[Sec] 亡语触发: ${target.name()} -> ${subject.name()}`);
                        eval(formula);

                        if (b && b.isAlive !== undefined) {
                            if (b.result().hpAffected) {
                                b.startDamagePopup();
                                b.performDamage();
                            }
                            if (b.isDead()) b.performCollapse();
                        }
                    } catch (e) { console.error(`[Sec] A3 Error`, e); }
                }
             }
        }

        if (!item) return;

        // ------------------------------------------------------------------
        // 2.2 【模块 B】 技能主动机制 (保持不变，已包含之前的所有修复)
        // ------------------------------------------------------------------
        const note = item.note;
        
        // --- B1. 状态交互 ---
        const stateInteractMatches = note.matchAll(/<状态交互[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/g);
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
                        if (val !== 0) { 
                            t.gainHp(-val);
                            t.result().hpDamage = val;
                            t.result().hpAffected = true;
                            t.startDamagePopup();
                            if (val > 0) t.performDamage();
                        }
                        if (removeState) t.removeState(stateId);
                    } catch (e) { console.error(`[Sec] B1 Error`, e); }
                }
            });
        }

        // --- B2. 力场共鸣 ---
        const fieldResMatches = note.matchAll(/<力场共鸣[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/g);
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
                                m.result().hpDamage = val;
                                m.result().hpAffected = true;
                                m.startDamagePopup();
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
                            target.result().hpDamage = val;
                            target.result().hpAffected = true;
                            target.startDamagePopup();
                            target.performDamage();
                        }
                        if (removeState) affectedMembers.forEach(m => m.removeState(stateId));
                    } catch(e) {}
                }
            }
        }

        // --- B3. 溅射伤害 (智能全兼容版) ---
        const splashMatch = note.match(/<溅射伤害[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*>/);
        if (splashMatch && actualDamage > 0) {
            const param1 = splashMatch[1].trim(); 
            const range = parseInt(splashMatch[2]);
            const friends = target.friendsUnit(); 
            const centerIndex = target.index();
            
            const neighbors = friends.members().filter(member => {
                const idx = member.index();
                return member !== target && 
                       member.isAlive() && 
                       member.isAppeared() && 
                       Math.abs(idx - centerIndex) <= range;
            });
            
            if (neighbors.length > 0) {
                console.log(`[Sec] 溅射判定: 目标[${target.name()}] 范围[${range}] 命中[${neighbors.length}]个邻居`);
            } else {
                console.log(`[Sec] 溅射判定: 目标[${target.name()}] 范围[${range}] 周围没有活着的队友`);
            }

            neighbors.forEach(n => {
                let splashDmg = 0;
                if (!isNaN(param1) && !/[ab]\.|v\[/.test(param1) && parseFloat(param1) <= 5.0) {
                    const rate = parseFloat(param1);
                    splashDmg = Math.floor(actualDamage * rate);
                    console.log(`[Sec] -> 触发比例溅射 (${rate * 100}%)，伤害: ${splashDmg}`);
                } else {
                    try {
                        const a = subject, b = n, origin = target, d = actualDamage, v = $gameVariables._data;
                        splashDmg = Math.floor(eval(param1));
                        console.log(`[Sec] -> 触发公式溅射 "${param1}"，伤害: ${splashDmg}`);
                    } catch(e) { console.error("[Sec] 溅射公式解析错误:", e); }
                }

                if (splashDmg > 0) {
                    n.gainHp(-splashDmg);
                    n.result().hpDamage = splashDmg;
                    n.result().hpAffected = true;
                    n.startDamagePopup();
                    n.performDamage();
                    if (n.isDead()) n.performCollapse();
                }
            });
        }

        // --- B4. 斩杀追击 ---
        const execMatch = note.match(/<斩杀追击[:：]\s*(\d+)\s*[,，]\s*([^>]+)\s*>/);
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
                            target.result().hpDamage = bonusDmg;
                            target.result().hpAffected = true;
                            target.startDamagePopup();
                            target.performDamage();
                            if (target.isDead()) target.performCollapse();
                        }, 100);
                    }
                } catch(e) { console.error("[Sec] 斩杀计算错误", e); }
            }
        }

        // --- B5. 技能吸血 ---
        const drainMatch = note.match(/<技能吸血[:：]\s*([\d\.]+)\s*>/);
        if (drainMatch && actualDamage > 0) {
            const rate = parseFloat(drainMatch[1]);
            const healAmount = Math.floor(actualDamage * rate);
            if (healAmount > 0 && subject.isAlive()) {
                subject.gainHp(healAmount);
                subject.result().hpDamage = -healAmount; 
                subject.result().hpAffected = true;
                subject.startDamagePopup();
            }
        }

        // ------------------------------------------------------------------
        // 2.3 【模块 C】 高级与遗留机制
        // ------------------------------------------------------------------
        
        // --- C1. 状态循环 ---
        const stateCycleMatch = note.match(/<状态循环[:：]\s*([^>]+)\s*>/);
        if (stateCycleMatch) {
            const stateIds = stateCycleMatch[1].split(/[,，]/).map(id => parseInt(id.trim()));
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

        // --- C2. 复杂流程 ---
        if (!this._specialEffectsProcessed) {
            this._specialEffectsProcessed = true;
            if (subject) subject._counterAttackBuffApplied = false;
            processComplexFeatures.call(this, subject, target, note);
        }
    };

    /**
     * 处理复杂的遗留功能 (正则增强)
     */
    function processComplexFeatures(user, target, note) {
        // 功能 8：累计反击
        const counterMatch = note.match(/<累计反击[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/);
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
        const dtMatch = note.match(/<伤害转移[:：]\s*(\d+)\s*[,，]\s*([\d\.]+)(?:[,，]\s*([^,，>]+)(?:[,，]\s*([^>]+))?)?\s*>/);
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
        const ricochetMatch = note.match(/<弹射伤害[:：]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/);
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
                                const a = markerActor; const b = target;      
                                transferDamage = Math.floor(eval(transferInfo.transferFormula));
                            } else {
                                transferDamage = Math.floor(d * r * (1 + mhp/1000) * (1 - Math.min(0.5, def/1000) - Math.min(0.3, mdef/1000)));
                            }
                            transferDamage = Math.max(1, transferDamage);

                            if (transferInfo.recoverFormula) {
                                const a = markerActor; const b = target;
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
    // 5. 【模块 D】 全局行动监听器 (Action Observer) [v2.9 修复补回]
    // ======================================================================
    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        const triggerSubject = this._subject;
        const triggerAction = this._action;
        _BattleManager_endAction.call(this);

        if (triggerSubject && triggerAction && !this._isRecursiveForce) {
            this._isRecursiveForce = true;
            this.broadcastActionSignal(triggerSubject, triggerAction);
            this._isRecursiveForce = false;
        }
    };

    BattleManager.broadcastActionSignal = function(source, action) {
        const allMembers = $gameParty.members().concat($gameTroop.members());
        for (const observer of allMembers) {
            if (!observer.isAlive() || !observer.canMove() || observer === source) continue;
            
            // D1. 队友协战
            if (observer.friendsUnit() === source.friendsUnit()) {
                this.checkSynergy(observer, source, action);
            }
            // D2. 敌方识破
            if (observer.friendsUnit() !== source.friendsUnit()) {
                this.checkReaction(observer, source, action);
            }
        }
    };

    // ======================================================================
    // 协战与识破 (v2.9.6 装备兼容版)
    // ======================================================================

    // 协战检查
    BattleManager.checkSynergy = function(observer, source, action) {
        // 读取该角色身上的所有备注(含装备)
        const note = _Sec_GetBattlerNotes(observer);

        const matches = note.matchAll(/<队友协战[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;

            // --- 判定逻辑优化 (排除防御) ---
            if (type === 'any') {
                if (!action.isGuard()) matchType = true;
            }
            else if (type === 'attack') {
                if (action.isAttack() && !action.isGuard()) matchType = true;
            }
            else if (type === 'skill') {
                if (action.isSkill() && !action.isAttack() && !action.isGuard()) matchType = true;
            }
            else if (type === 'support') {
                if ((action.isForFriend() || action.isRecover()) && !action.isGuard()) matchType = true;
            }

            // --- 触发执行 ---
            if (matchType && Math.random() * 100 < chance) {
                let targetIndex = -2;
                if (action.isForOne() && this._targets && this._targets.length > 0) {
                    targetIndex = this._targets[0].index();
                } else if (action.isForOpponent()) {
                    const randomTarget = source.opponentsUnit().randomTarget();
                    if (randomTarget) targetIndex = randomTarget.index();
                }

                console.log(`[Sec] 协战判定(装备兼容): ${observer.name()} 响应协战`);
                
                observer.forceAction(skillId, targetIndex);
                this.forceAction(observer);
                return; 
            }
        }
    };

    // 识破检查
    BattleManager.checkReaction = function(observer, source, action) {
        // 读取该角色身上的所有备注(含装备)
        const note = _Sec_GetBattlerNotes(observer);

        const matches = note.matchAll(/<敌方识破[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any') {
                if (!action.isGuard()) matchType = true;
            }
            else if (type === 'support') {
                if ((action.isForFriend() || action.isRecover()) && !action.isGuard()) matchType = true;
            }
            else if (type === 'attack') {
                if (action.isAttack() && action.isForOpponent() && !action.isGuard()) matchType = true;
            }

            if (matchType && Math.random() * 100 < chance) {
                const reactionSkill = $dataSkills[skillId];
                let targetIndex = -1;
                if (reactionSkill) {
                    if ([1, 2, 3, 4, 5, 6].includes(reactionSkill.scope)) {
                        targetIndex = source.index();
                    } else {
                        targetIndex = observer.index();
                    }
                }

                console.log(`[Sec] 识破触发(装备兼容): ${observer.name()} 反制`);
                observer.forceAction(skillId, targetIndex);
                this.forceAction(observer);
                return;
            }
        }
    };

})();