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
    // 1. 全局数据存储
    // ======================================================================
    const _Sec_AccumulatedDamage = new Map();
    const _Sec_TransferMarker = new Map();

    // ======================================================================
    // 2. 核心逻辑挂钩：Game_Action.prototype.executeDamage
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        
        // 【修复】在造成伤害前，先记录目标是否已经死亡
        const wasDead = target.isDead();

        // 2.0 执行原版逻辑
        _Game_Action_executeDamage.call(this, target, value);

        const subject = this.subject();
        const item = this.item();
        const actualDamage = target.result().hpDamage; // 获取实际伤害

        // ------------------------------------------------------------------
        // 2.1 【模块 A】 被动机制
        // ------------------------------------------------------------------
        
        // --- A1. 普攻特效 ---
        if (subject && subject.isActor() && this.isAttack()) {
            const classData = subject.currentClass();
            if (classData && classData.note) {
                const matches = classData.note.matchAll(/<战斗触发[:：]\s*Attack\s*[,，]\s*([^>]+)>/gi);
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
                    const matches = classData.note.matchAll(/<战斗触发[:：]\s*Hit\s*[,，]\s*([^>]+)>/gi);
                    for (const match of matches) {
                        const formula = match[1].trim();
                        try {
                            const a = target, b = subject, v = $gameVariables._data;
                            const dmg = actualDamage;
                            if (formula.includes('gainMp')) target._ignoreMpLog = true;
                            eval(formula);
                            target._ignoreMpLog = false;
                        } catch (e) { console.error(`[Sec] A2 Error`, e); }
                    }
                }
            }
        }

        // --- A3. 亡语 (修复版) ---
        // 只有当目标“之前没死”且“现在死了”才触发，防止鞭尸和未致死触发
        if (target && !wasDead && target.isDead()) {
             let noteData = "";
             
             // 【修复】同时读取“角色备注”和“职业备注”，防止玩家写错地方
             if (target.isActor()) {
                 const actorNote = target.actor().note || "";
                 const classNote = (target.currentClass() && target.currentClass().note) || "";
                 noteData = actorNote + "\n" + classNote;
             } else if (target.isEnemy()) {
                 const enemyData = target.enemy();
                 if (enemyData) noteData = enemyData.note;
             }

             if (noteData) {
                const matches = noteData.matchAll(/<战斗触发[:：]\s*Dead\s*[,，]\s*([^>]+)>/gi);
                for (const match of matches) {
                    const formula = match[1].trim();
                    try {
                        const a = target;  // 死者
                        const b = subject; // 凶手
                        const v = $gameVariables._data;
                        const dmg = actualDamage;
                        
                        console.log(`[Sec] 亡语触发: ${target.name()} 亡语反击 -> ${subject.name()}`);
                        
                        // 1. 执行公式 (数据层变动)
                        eval(formula);

                        // 2. 【修复】手动补全凶手(b)的视觉反馈
                        if (b && b.isAlive !== undefined) {
                            // 如果公式导致了凶手HP变动 (gainHp会自动设置 hpAffected 为 true)
                            if (b.result().hpAffected) {
                                b.startDamagePopup(); // 弹出伤害数字
                                b.performDamage();    // 播放受击动作(变白/震动)和音效
                            }
                            
                            // 3. 【修复】如果凶手被亡语反杀
                            if (b.isDead()) {
                                b.performCollapse(); // 播放敌人死亡/消失动画
                                if (b.isActor()) {
                                    b.refresh(); // 如果是角色，刷新状态栏
                                }
                            }
                        }
                    } catch (e) { console.error(`[Sec] A3 Error`, e); }
                }
             }
        }

        if (!item) return;

        // ------------------------------------------------------------------
        // 2.2 【模块 B】 技能主动机制
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

        // --- B3. 溅射伤害 (功能修复 + 视觉优化) ---
        const splashMatch = note.match(/<溅射伤害[:：]\s*([\d\.]+)\s*[,，]\s*(\d+)\s*>/);
        if (splashMatch && actualDamage > 0) {
            const rate = parseFloat(splashMatch[1]);
            const range = parseInt(splashMatch[2]);
            const friends = target.friendsUnit(); 
            const centerIndex = target.index();
            
            // 筛选条件：同阵营 + 活着 + 已显形 + 索引距离符合 + 不是目标本人
            const neighbors = friends.members().filter(member => {
                const idx = member.index();
                return member !== target && 
                       member.isAlive() && 
                       member.isAppeared() && 
                       Math.abs(idx - centerIndex) <= range;
            });
            
            if (neighbors.length > 0) {
                console.log(`[Sec] 溅射触发: 中心[${target.name()}] 范围[${range}] 溅射目标数[${neighbors.length}]`);
            }

            neighbors.forEach(n => {
                const splashDmg = Math.floor(actualDamage * rate);
                if (splashDmg > 0) {
                    n.gainHp(-splashDmg);
                    // 【修复】添加完整的视觉反馈
                    n.startDamagePopup();  // 弹数字
                    n.performDamage();     // 受击动作/变白
                    if (n.isDead()) n.performCollapse(); // 死亡动画
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
                            target.startDamagePopup();
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
                subject.startDamagePopup();
                subject.performDamage(); // 治疗也可能需要反馈，或改用 sound
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

    // 协战检查 (正则增强)
    BattleManager.checkSynergy = function(observer, source, action) {
        let note = "";
        if (observer.isActor()) { const c = observer.currentClass(); if(c) note = c.note; }
        else { const e = observer.enemy(); if(e) note = e.note; }

        const matches = note.matchAll(/<队友协战[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
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
                observer.forceAction(skillId, -2); // 跟随目标
                return;
            }
        }
    };

    // 识破检查 (正则增强)
    BattleManager.checkReaction = function(observer, source, action) {
        let note = "";
        if (observer.isActor()) { const c = observer.currentClass(); if(c) note = c.note; }
        else { const e = observer.enemy(); if(e) note = e.note; }

        const matches = note.matchAll(/<敌方识破[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any') matchType = true;
            else if (type === 'support' && (action.isForFriend() || action.isRecover())) matchType = true;
            else if (type === 'attack' && action.isForOpponent()) matchType = true;

            if (matchType && Math.random() * 100 < chance) {
                const reactionSkill = $dataSkills[skillId];
                let targetIndex = -2;
                if (reactionSkill) {
                     // 如果是攻击技能，锁定源头；如果是Buff技能，锁定自己
                     if ([1, 2, 3, 4, 5, 6].includes(reactionSkill.scope)) targetIndex = source.index();
                     else targetIndex = observer.index();
                }
                observer.forceAction(skillId, targetIndex);
                return;
            }
        }
    };

})();