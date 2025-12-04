/*:
 * @target MZ
 * @plugindesc [战斗] 战斗机制扩展 & 伤害传导体系 & 行动条推拉
 * @author Secmon (Refactored by Gemini)
 * @version 3.7.2
 *
 * @param ---Default Animations---
 * @text [默认动画设置]
 * @default
 *
 * @param DefAnimHit
 * @parent ---Default Animations---
 * @text 默认打击动画ID
 * @desc 伤害类效果使用的默认动画。
 * @type animation
 * @default 1
 *
 * @param DefAnimHeal
 * @parent ---Default Animations---
 * @text 默认治疗动画ID
 * @desc 恢复类效果使用的默认动画。
 * @type animation
 * @default 46
 *
 * @param DefAnimBuff
 * @parent ---Default Animations---
 * @text 默认Buff动画ID
 * @desc 增益/守护类效果使用的默认动画。
 * @type animation
 * @default 52
 *
 * @param ---Time Settings---
 * @text [时间轴参数设置]
 * @default
 *
 * @param GuardianDelay
 * @parent ---Time Settings---
 * @text 守护光环间隔(ms)
 * @desc 守护光环触发时的演出间隔。建议 150-300。
 * @type number
 * @default 200
 *
 * @param ChargeDelay
 * @parent ---Time Settings---
 * @text 蓄力释放延迟(ms)
 * @desc 蓄力攻击追加伤害的延迟时间。建议 300-500。
 * @type number
 * @default 400
 *
 * @param SynergyDelay
 * @parent ---Time Settings---
 * @text 队友协战延迟(ms)
 * @desc (注意：为保证稳定性，协战逻辑不再延迟，此参数仅作预留或微量视觉调整)
 * @type number
 * @default 0
 *
 * @param StateInteractDelay
 * @parent ---Time Settings---
 * @text 状态交互延迟(ms)
 * @desc 状态交互触发伤害/治疗的延迟时间。建议 200。
 * @type number
 * @default 200
 *
 * @param FieldResonanceDelay
 * @parent ---Time Settings---
 * @text 力场共鸣延迟(ms)
 * @desc 力场扩散或聚集时的延迟时间。建议 200-300。
 * @type number
 * @default 200
 *
 * @param RicochetBaseDelay
 * @parent ---Time Settings---
 * @text 闪电链初始间隔(ms)
 * @desc 弹射/闪电链第一次弹跳的间隔时间。
 * @type number
 * @default 200
 *
 * @param RicochetDecay
 * @parent ---Time Settings---
 * @text 闪电链延迟递减(ms)
 * @desc 每次弹跳减少的间隔时间（越弹越快）。
 * @type number
 * @default 30
 *
 * @help
 * ============================================================================
 * ★ 插件功能手册 v3.7.2 (核心修正版) ★
 * ============================================================================
 * 【关键修复】
 * v3.7.2: 
 * 1. [Fix] 修复了队友协战/敌方识破完全不触发的严重 Bug。
 * 原因：原版 endAction 会清空 subject，导致插件无法获取行动源头。
 * 现已修正为在清空前捕获引用。
 * 2. [Check] 再次确认了多重协战队列逻辑，确保多个队友可以依次响应。
 *
 * 【重要提示】
 * 关于 <队友协战: Skill, ...>
 * - "Skill" 类型仅在施放【技能】时触发。
 * - 【普通攻击】在代码逻辑中属于 Attack，不属于 Skill。
 * - 如果希望普攻也触发，请把类型写为 Attack，或者 Any。
 *
 * ============================================================================
 * 一、标签写法速查
 * ----------------------------------------------------------------------------
 * 1. 队友协战 (支持写多行，依次触发)
 * <队友协战: Attack, 100, 301>
 * <队友协战: Skill, 100, 315>
 *
 * 2. 敌方识破
 * <敌方识破: Support, 100, 80>
 *
 * 3. 推拉条
 * <推条: 10, 66>
 * <拉条: 10, 66>
 *
 * 4. 守护光环 (动画播在队友身上)
 * <守护光环: 60, 0.8, damage, 52>
 *
 * 5. 蓄力释放 (动画播在敌人身上)
 * <蓄力释放: 50, d*2, 1>
 *
 * ============================================================================
 */

(() => {
    'use strict';

    // ======================================================================
    // 0. 参数读取
    // ======================================================================
    const pluginName = "Sec_BattleSystemInstance";
    const parameters = PluginManager.parameters(pluginName);
    
    const Sec_Params = {
        guardianDelay: Number(parameters['GuardianDelay'] || 200),
        chargeDelay: Number(parameters['ChargeDelay'] || 400),
        synergyDelay: Number(parameters['SynergyDelay'] || 0), 
        stateInteractDelay: Number(parameters['StateInteractDelay'] || 200),
        fieldDelay: Number(parameters['FieldResonanceDelay'] || 200),
        ricochetBase: Number(parameters['RicochetBaseDelay'] || 200),
        ricochetDecay: Number(parameters['RicochetDecay'] || 30)
    };

    const DEF_ANIM = {
        HIT: Number(parameters['DefAnimHit'] || 1),
        HEAL: Number(parameters['DefAnimHeal'] || 46),
        BUFF: Number(parameters['DefAnimBuff'] || 52),
        GUARD: Number(parameters['DefAnimBuff'] || 52)
    };

    // ======================================================================
    // 1. 辅助函数 & 日志净化
    // ======================================================================
    function _Sec_GetBattlerNotes(battler) {
        let notes = "";
        if (battler.isActor()) {
            notes += (battler.actor().note || "") + "\n";
            if (battler.currentClass()) notes += (battler.currentClass().note || "") + "\n";
            battler.equips().forEach(item => { if (item) notes += (item.note || "") + "\n"; });
        } else if (battler.isEnemy()) {
            const enemy = battler.enemy();
            if (enemy) notes += (enemy.note || "") + "\n";
        }
        battler.states().forEach(state => {
            if (state) notes += (state.note || "") + "\n";
        });
        return notes;
    }

    function _Sec_ParseParamAndAnim(str, defaultAnimId = 0) {
        const regex = /^(.*?)(?:[,，]\s*(\d+))?$/s;
        const match = str.match(regex);
        if (match) {
            return {
                content: match[1].trim(),
                animId: match[2] ? parseInt(match[2]) : defaultAnimId
            };
        }
        return { content: str, animId: defaultAnimId };
    }

    function _Sec_PlayAnim(target, animId) {
        if (target && animId > 0) {
            if ($gameTemp && $gameTemp.requestAnimation) {
                $gameTemp.requestAnimation([target], animId);
            }
        }
    }

    // 日志净化
    const _Window_BattleLog_displayHpDamage = Window_BattleLog.prototype.displayHpDamage;
    Window_BattleLog.prototype.displayHpDamage = function(target) {
        if (target._ignoreDamageLog) return; 
        _Window_BattleLog_displayHpDamage.call(this, target);
    };
    const _Window_BattleLog_displayMpDamage = Window_BattleLog.prototype.displayMpDamage;
    Window_BattleLog.prototype.displayMpDamage = function(target) {
        if (target._ignoreMpLog) return; 
        _Window_BattleLog_displayMpDamage.call(this, target);
    };
    const _Window_BattleLog_displayTpDamage = Window_BattleLog.prototype.displayTpDamage;
    Window_BattleLog.prototype.displayTpDamage = function(target) {
        if (target._ignoreMpLog) return; 
        _Window_BattleLog_displayTpDamage.call(this, target);
    };

    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        const all = $gameParty.members().concat($gameTroop.members());
        all.forEach(b => {
            b._ignoreMpLog = false;
            b._ignoreDamageLog = false;
        });
        _BattleManager_startAction.call(this);
    };

    function _Sec_SuppressLog(battler) {
        if (!battler) return;
        battler._ignoreDamageLog = true;
        battler._ignoreMpLog = true;
    }

    // ======================================================================
    // 2. 核心逻辑挂钩：Game_Action.prototype.executeDamage
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        
        const wasDead = target.isDead();

        _Game_Action_executeDamage.call(this, target, value);

        const subject = this.subject();
        const item = this.item();
        const actualDamage = target.result().hpDamage; 

        // ------------------------------------------------------------------
        // 【模块 A】 攻击/行动触发
        // ------------------------------------------------------------------
        if (subject && subject.isAlive()) {
            const noteData = _Sec_GetBattlerNotes(subject);

            // A1. 攻击特效
            if (this.isAttack() && noteData) {
                const matches = noteData.matchAll(/<战斗触发[:：]\s*Attack\s*[,，]\s*([^>]+)>/gi);
                for (const match of matches) {
                    try {
                        const formula = match[1].trim();
                        const a = subject, b = target, v = $gameVariables._data;
                        _Sec_SuppressLog(subject); _Sec_SuppressLog(target);
                        eval(formula);
                    } catch (e) { console.error(`[Sec] A1 Error`, e); }
                }
            }

            // A2. 蓄力释放
            const isHpDamageType = item.damage && (item.damage.type === 1 || item.damage.type === 5);
            if ((this.isAttack() || this.isSkill()) && isHpDamageType && noteData) {
                const releaseMatches = noteData.matchAll(/<蓄力释放[:：]\s*(\d+)\s*[,，]\s*([^>]+)>/gi);
                for (const match of releaseMatches) {
                    const stateId = parseInt(match[1]);
                    const rawContent = match[2];
                    
                    if (subject.isStateAffected(stateId) && subject._secStoredDmg > 0) {
                        try {
                            const parsed = _Sec_ParseParamAndAnim(rawContent, DEF_ANIM.HIT);
                            const formula = parsed.content;
                            const animId = parsed.animId;

                            const d = subject._secStoredDmg; 
                            const a = subject, b = target, v = $gameVariables._data;
                            const bonusDmg = Math.floor(eval(formula));
                            
                            if (bonusDmg > 0) {
                                console.log(`[Sec] 蓄力释放: 伤害[${bonusDmg}]`);
                                setTimeout(() => {
                                    if (target && (target.isAlive() || !target._collapsed)) {
                                        _Sec_SuppressLog(target);
                                        target.gainHp(-bonusDmg);
                                        
                                        target.result().hpDamage = bonusDmg;
                                        target.result().hpAffected = true;
                                        target.startDamagePopup();
                                        target.performDamage();
                                        _Sec_PlayAnim(target, animId); 
                                        if (target.isDead()) target.performCollapse();
                                    }
                                }, Sec_Params.chargeDelay); 
                            }
                            subject._secStoredDmg = 0;
                            subject.removeState(stateId);
                        } catch(e) { console.error("[Sec] 蓄力释放计算错误", e); }
                    }
                }
            }
        }

        // ------------------------------------------------------------------
        // 【模块 B】 受击/被动触发
        // ------------------------------------------------------------------
        if (target && target.result().isHit()) { 
            const targetNote = _Sec_GetBattlerNotes(target);

            // B1. 受击特效
            if (targetNote) {
                const matches = targetNote.matchAll(/<战斗触发[:：]\s*Hit\s*[,，]\s*([^>]+)>/gi);
                for (const match of matches) {
                    try {
                        const formula = match[1].trim();
                        const a = target, b = subject, v = $gameVariables._data;
                        _Sec_SuppressLog(a); _Sec_SuppressLog(b);
                        eval(formula);
                    } catch (e) { console.error(`[Sec] B1 Error`, e); }
                }
            }

            // B2. 受击蓄力
            if (actualDamage > 0 && targetNote) {
                const chargeMatches = targetNote.matchAll(/<受击蓄力[:：]\s*(\d+)\s*>/gi);
                for (const match of chargeMatches) {
                    const stateId = parseInt(match[1]);
                    if (target.isStateAffected(stateId)) {
                        target._secStoredDmg = (target._secStoredDmg || 0) + actualDamage;
                    }
                }
            }

            // B3. 守护光环
            if (actualDamage > 0) {
                const friends = target.friendsUnit().members();
                for (const guardian of friends) {
                    if (guardian === target || !guardian.isAlive()) continue;

                    const gNote = _Sec_GetBattlerNotes(guardian);
                    const guardMatches = gNote.matchAll(/<守护光环[:：]\s*(\d+)\s*[,，]\s*([\d\.]+)\s*[,，]\s*([^>]+)>/gi);
                    
                    for (const match of guardMatches) {
                        const stateId = parseInt(match[1]);
                        const rate = parseFloat(match[2]);
                        const rawContent = match[3];

                        if (guardian.isStateAffected(stateId)) {
                            const parsed = _Sec_ParseParamAndAnim(rawContent, DEF_ANIM.GUARD);
                            const formula = parsed.content;
                            const animId = parsed.animId;

                            const damage = actualDamage; 
                            let transferAmount = Math.floor(damage * rate);
                            
                            if (transferAmount > 0) {
                                let guardianDmg = transferAmount;
                                try { guardianDmg = Math.floor(eval(formula)); } catch(e) {}

                                setTimeout(() => {
                                    if (target) {
                                        _Sec_SuppressLog(target); target.gainHp(transferAmount);
                                        target.result().hpDamage = -transferAmount;
                                        target.result().hpAffected = true;
                                        target.startDamagePopup();
                                        target.performDamage(); 
                                        _Sec_PlayAnim(target, animId); 
                                    }

                                    setTimeout(() => {
                                        if (guardian && guardian.isAlive()) {
                                            _Sec_SuppressLog(guardian); guardian.gainHp(-guardianDmg);
                                            guardian.result().hpDamage = guardianDmg;
                                            guardian.result().hpAffected = true;
                                            guardian.startDamagePopup();
                                            guardian.performDamage();
                                            if (guardian.isDead()) guardian.performCollapse();
                                        }
                                    }, Sec_Params.guardianDelay); 

                                }, Sec_Params.guardianDelay); 
                            }
                            break; 
                        }
                    }
                }
            }
        }

        // A3. 亡语
        if (target && !wasDead && target.isDead()) {
             const noteData = _Sec_GetBattlerNotes(target);
             if (noteData) {
                const matches = noteData.matchAll(/<战斗触发[:：]\s*Dead\s*[,，]\s*([^>]+)>/gi);
                for (const match of matches) {
                    try {
                        const formula = match[1].trim();
                        const a = target, b = subject, v = $gameVariables._data, dmg = actualDamage;
                        _Sec_SuppressLog(a); _Sec_SuppressLog(b);
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
        // 【模块 C】 技能特效
        // ------------------------------------------------------------------
        const note = item.note;
        
        // --- C1. 状态交互 ---
        const stateInteractMatches = note.matchAll(/<状态交互[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/g);
        for (const match of stateInteractMatches) {
            const stateId = parseInt(match[1]);
            const formula = match[2].trim();
            const removeState = match[3].trim().toLowerCase() === 'true';
            const rawRange = match[4];

            let defaultAnim = DEF_ANIM.HIT;
            const rangeLower = rawRange.split(/[,，]/)[0].trim().toLowerCase();
            if (rangeLower === 'allallies' || rangeLower === 'self') defaultAnim = DEF_ANIM.BUFF;

            const parsed = _Sec_ParseParamAndAnim(rawRange, defaultAnim);
            const range = parsed.content.toLowerCase();
            const animId = parsed.animId;

            let targets = [];
            if (range === 'target') targets = [target];
            else if (range === 'allallies') targets = $gameParty.members();
            else if (range === 'self') targets = [subject];

            targets.forEach(t => {
                if (t.isAlive() && t.isStateAffected(stateId)) {
                    setTimeout(() => {
                        try {
                            const a = subject, b = t, v = $gameVariables._data;
                            const val = Math.floor(eval(formula));
                            if (val !== 0) { 
                                _Sec_SuppressLog(t); t.gainHp(-val); 
                                t.result().hpDamage = val;
                                t.result().hpAffected = true;
                                t.startDamagePopup();
                                if (val > 0) t.performDamage();
                                _Sec_PlayAnim(t, animId); 
                            }
                            if (removeState) t.removeState(stateId);
                        } catch (e) { console.error(`[Sec] C1 Error`, e); }
                    }, Sec_Params.stateInteractDelay);
                }
            });
        }

        // --- C2. 力场共鸣 ---
        const fieldResMatches = note.matchAll(/<力场共鸣[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/g);
        for (const match of fieldResMatches) {
            const stateId = parseInt(match[1]);
            const mode = match[2].trim().toLowerCase();
            const formula = match[3].trim();
            const rawRemove = match[4];
            
            const parsed = _Sec_ParseParamAndAnim(rawRemove, DEF_ANIM.HIT);
            const removeState = parsed.content.toLowerCase() === 'true';
            const animId = parsed.animId;

            const allBattlers = $gameParty.members().concat($gameTroop.members());
            const affectedMembers = allBattlers.filter(m => m.isAlive() && m.isStateAffected(stateId));

            if (mode === 'spread') {
                setTimeout(() => {
                    affectedMembers.forEach(m => {
                        try {
                            const a = subject, b = m, v = $gameVariables._data;
                            const val = Math.floor(eval(formula));
                            if (val > 0) {
                                _Sec_SuppressLog(m); m.gainHp(-val); 
                                m.result().hpDamage = val;
                                m.result().hpAffected = true;
                                m.startDamagePopup();
                                m.performDamage(); 
                                _Sec_PlayAnim(m, animId);
                                if (m.isDead()) m.performCollapse();
                            }
                        } catch(e) {}
                    });
                    if (removeState) affectedMembers.forEach(m => m.removeState(stateId));
                }, Sec_Params.fieldDelay);
            } else if (mode === 'gather') {
                setTimeout(() => {
                    const n = affectedMembers.length;
                    if (n > 0) {
                        try {
                            const a = subject, b = target, v = $gameVariables._data;
                            const val = Math.floor(eval(formula));
                            if (val > 0) {
                                _Sec_SuppressLog(target); target.gainHp(-val); 
                                target.result().hpDamage = val;
                                target.result().hpAffected = true;
                                target.startDamagePopup();
                                target.performDamage();
                                _Sec_PlayAnim(target, animId);
                            }
                            if (removeState) affectedMembers.forEach(m => m.removeState(stateId));
                        } catch(e) {}
                    }
                }, Sec_Params.fieldDelay);
            }
        }

        // --- C3. 溅射伤害 ---
        const splashMatch = note.match(/<溅射伤害[:：]\s*([^,，]+)\s*[,，]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/);
        if (splashMatch && actualDamage > 0) {
            const param1 = splashMatch[1].trim(); 
            const range = parseInt(splashMatch[2]);
            const animId = splashMatch[3] ? parseInt(splashMatch[3]) : DEF_ANIM.HIT; 

            const friends = target.friendsUnit(); 
            const centerIndex = target.index();
            const neighbors = friends.members().filter(member => {
                const idx = member.index();
                return member !== target && member.isAlive() && member.isAppeared() && Math.abs(idx - centerIndex) <= range;
            });
            
            if (neighbors.length > 0) console.log(`[Sec] 溅射: ${neighbors.length}目标`);

            neighbors.forEach(n => {
                let splashDmg = 0;
                if (!isNaN(param1) && !/[ab]\.|v\[/.test(param1) && parseFloat(param1) <= 5.0) {
                    splashDmg = Math.floor(actualDamage * parseFloat(param1));
                } else {
                    try {
                        const a = subject, b = n, origin = target, d = actualDamage, v = $gameVariables._data;
                        splashDmg = Math.floor(eval(param1));
                    } catch(e) {}
                }

                if (splashDmg > 0) {
                    _Sec_SuppressLog(n); n.gainHp(-splashDmg); 
                    n.result().hpDamage = splashDmg;
                    n.result().hpAffected = true;
                    n.startDamagePopup();
                    n.performDamage();
                    _Sec_PlayAnim(n, animId);
                    if (n.isDead()) n.performCollapse();
                }
            });
        }

        // --- C7. 弹射伤害/闪电链 ---
        const ricochetMatch = note.match(/<弹射伤害[:：]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/);
        if (ricochetMatch) {
            const initFormula = ricochetMatch[1]; 
            const nextFormula = ricochetMatch[2]; 
            const maxBounces = parseInt(ricochetMatch[3]);
            const damageCapM = parseInt(ricochetMatch[4]);
            let allowRepeat = ricochetMatch[5].trim().toLowerCase() === 'true';
            const rawMode = ricochetMatch[6];
            
            const parsed = _Sec_ParseParamAndAnim(rawMode, DEF_ANIM.HIT);
            const mode = parsed.content.toLowerCase();
            const animId = parsed.animId;
            
            if (mode === 'random') allowRepeat = true;

            const allEnemies = $gameTroop.members().concat($gameParty.members()).filter(e => 
                e.friendsUnit() === target.friendsUnit() && e !== target && e.isAlive()
            );

            let bouncePool = [];
            if (mode === 'random') bouncePool = allEnemies; 
            else bouncePool = allEnemies.sort((a, b) => a.index() - b.index());

            let targetsSequence = [];
            if (bouncePool.length > 0) {
                if (mode === 'random') {
                    for (let i = 0; i < maxBounces; i++) targetsSequence.push(bouncePool[Math.floor(Math.random() * bouncePool.length)]);
                } else {
                    if (allowRepeat) for (let i = 0; i < maxBounces; i++) targetsSequence.push(bouncePool[i % bouncePool.length]);
                    else targetsSequence = bouncePool.slice(0, Math.min(maxBounces, bouncePool.length));
                }
            }

            let lastDamage = actualDamage; 
            let accumulatedDelay = 0;

            targetsSequence.forEach((enemy, index) => {
                const bounceNum = index + 1;
                const currentInterval = Math.max(50, Sec_Params.ricochetBase - (index * Sec_Params.ricochetDecay));
                accumulatedDelay += currentInterval;

                setTimeout(() => {
                    if (enemy.isDead() && !allowRepeat) return;

                    let currentDmg = 0;
                    try {
                        const a = subject, b = enemy, v = $gameVariables._data;
                        const damage = lastDamage; 

                        let formulaToUse = (index === 0) ? initFormula : nextFormula;
                        currentDmg = Math.floor(eval(formulaToUse));
                        lastDamage = currentDmg; 
                        
                        if (damageCapM > 0) {
                            lastDamage = Math.min(lastDamage, damageCapM);
                            currentDmg = lastDamage;
                        }
                        
                        if (currentDmg > 0) {
                            _Sec_SuppressLog(enemy); enemy.gainHp(-currentDmg); 
                            enemy.result().hpDamage = currentDmg;
                            enemy.result().hpAffected = true;
                            enemy.startDamagePopup();
                            enemy.performDamage();
                            _Sec_PlayAnim(enemy, animId); 
                            if (enemy.isDead()) enemy.performCollapse();
                            
                            console.log(`[Sec] 闪电链: 第${bounceNum}跳 -> ${enemy.name()} 伤害:${currentDmg}`);
                        }
                    } catch (e) { console.error("[Sec] 弹射公式错误", e); }
                }, accumulatedDelay);
            });
        }

        // --- C4. 斩杀追击 ---
        const execMatch = note.match(/<斩杀追击[:：]\s*(\d+)\s*[,，]\s*([^>]+)\s*>/);
        if (execMatch) {
            const threshold = parseInt(execMatch[1]) / 100;
            const rawContent = execMatch[2];
            const parsed = _Sec_ParseParamAndAnim(rawContent, DEF_ANIM.HIT);
            const formula = parsed.content;
            const animId = parsed.animId;

            if (target.hpRate() < threshold && target.isAlive()) {
                try {
                    const a = subject, b = target, v = $gameVariables._data, dmg = actualDamage;
                    const bonusDmg = Math.floor(eval(formula));
                    if (bonusDmg > 0) {
                        setTimeout(() => {
                            _Sec_SuppressLog(target); target.gainHp(-bonusDmg); 
                            target.result().hpDamage = bonusDmg;
                            target.result().hpAffected = true;
                            target.startDamagePopup();
                            target.performDamage();
                            _Sec_PlayAnim(target, animId);
                            if (target.isDead()) target.performCollapse();
                        }, 100);
                    }
                } catch(e) {}
            }
        }

        // --- C5. 技能吸血 ---
        const drainMatch = note.match(/<技能吸血[:：]\s*([\d\.]+)(?:[,，]\s*(\d+))?\s*>/);
        if (drainMatch && actualDamage > 0) {
            const rate = parseFloat(drainMatch[1]);
            const animId = drainMatch[2] ? parseInt(drainMatch[2]) : DEF_ANIM.HEAL;

            const healAmount = Math.floor(actualDamage * rate);
            if (healAmount > 0 && subject.isAlive()) {
                _Sec_SuppressLog(subject); subject.gainHp(healAmount); 
                subject.result().hpDamage = -healAmount; 
                subject.result().hpAffected = true;
                subject.startDamagePopup();
                _Sec_PlayAnim(subject, animId);
            }
        }
        
        // --- C6. 状态循环 ---
        const stateCycleMatch = note.match(/<状态循环[:：]\s*([^>]+)\s*>/);
        if (stateCycleMatch) {
            const stateIds = stateCycleMatch[1].split(/[,，]/).map(id => parseInt(id.trim()));
            if (stateIds.length >= 2) {
                let currentIndex = stateIds.findIndex(id => target.isStateAffected(id));
                if (currentIndex === -1) target.addState(stateIds[0]);
                else if (currentIndex < stateIds.length - 1) {
                    target.removeState(stateIds[currentIndex]);
                    target.addState(stateIds[currentIndex + 1]);
                }
            }
        }
    };

    // ======================================================================
    // 3. Game_Action 挂钩 (推拉条)
    // ======================================================================
    const _Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(target) {
        _Game_Action_applyItemUserEffect.call(this, target);
        
        if (typeof BattleManager.applyTpbTickShift === 'function') {
            const note = this.item().note;
            
            // 推条
            const pushMatch = note.match(/<推条[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/);
            if (pushMatch) {
                const ticks = parseInt(pushMatch[1]);
                const animId = pushMatch[2] ? parseInt(pushMatch[2]) : 0;
                BattleManager.applyTpbTickShift(target, ticks);
                _Sec_PlayAnim(target, animId);
            }

            // 拉条
            const pullMatch = note.match(/<拉条[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/);
            if (pullMatch) {
                const ticks = parseInt(pullMatch[1]);
                const animId = pullMatch[2] ? parseInt(pullMatch[2]) : 0;
                BattleManager.applyTpbTickShift(target, -ticks);
                _Sec_PlayAnim(target, animId);
            }
        }
    };

    // ======================================================================
    // 4. 【核心重构】反应队列系统 (Reaction Queue System)
    // ======================================================================
    
    // 初始化队列
    BattleManager._secReactionQueue = [];

    // 执行队列中的下一个反应
    BattleManager.processSecReactionQueue = function() {
        if (this._secReactionQueue.length === 0) return;

        // 取出队首
        const reaction = this._secReactionQueue.shift();
        const observer = reaction.observer;
        
        console.log(`[Sec] 执行队列反应: ${observer.name()} -> 技能 ${reaction.skillId}`);

        // 【同步执行】不再使用 setTimeout，直接插入行动
        if (observer.isAlive() && observer.canMove()) {
            observer.forceAction(reaction.skillId, reaction.targetIndex);
            
            // 给生成的行动打上特殊标记，防止无限套娃
            const actions = observer._actions;
            if (actions && actions.length > 0) {
                // forceAction 会 push 到末尾
                const reactAction = actions[actions.length - 1]; 
                reactAction._isSecReaction = true;
            }

            this.forceAction(observer);
        } else {
            // 如果角色无法行动，立即尝试下一个，以免卡死队列
            this.processSecReactionQueue();
        }
    };

    // 监听行动结束，驱动队列
    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        // 【关键修复】在调用原版前捕获引用，因为原版方法可能会清空 this._subject
        const triggerSubject = this._subject;
        const triggerAction = this._action;
        
        // 执行原版逻辑
        _BattleManager_endAction.call(this);

        // 1. 如果刚才结束的是一个“反应动作”
        if (triggerAction && triggerAction._isSecReaction) {
            // 检查队列是否还有剩余反应
            if (this._secReactionQueue.length > 0) {
                this.processSecReactionQueue(); // 继续执行下一个
            }
            return; // 无论如何，反应动作本身不再触发新的广播
        }

        // 2. 如果是“普通动作”，则广播信号，填充队列
        // 【关键修复】使用捕获的 triggerSubject 进行判断，而不是 this._subject
        if (triggerSubject && triggerAction) {
            this._secReactionQueue = []; // 清空上一轮可能残留的垃圾
            this.broadcastActionSignal(triggerSubject, triggerAction);
            
            // 如果收集到了反应，开始执行第一个
            if (this._secReactionQueue.length > 0) {
                this.processSecReactionQueue();
            }
        }
    };

    BattleManager.broadcastActionSignal = function(source, action) {
        // 清除残留的静音标记
        const allMembers = $gameParty.members().concat($gameTroop.members());
        allMembers.forEach(b => {
            b._ignoreMpLog = false;
            b._ignoreDamageLog = false;
        });

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

    // 协战检查 (现在只负责 Push 队列)
    BattleManager.checkSynergy = function(observer, source, action) {
        const note = _Sec_GetBattlerNotes(observer);
        const matches = note.matchAll(/<队友协战[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any' && !action.isGuard()) matchType = true;
            else if (type === 'attack' && action.isAttack() && !action.isGuard()) matchType = true;
            else if (type === 'skill' && action.isSkill() && !action.isAttack() && !action.isGuard()) matchType = true;
            else if (type === 'support' && (action.isForFriend() || action.isRecover()) && !action.isGuard()) matchType = true;

            if (matchType && Math.random() * 100 < chance) {
                let targetIndex = -2;
                if (action.isForOne() && this._targets.length > 0) targetIndex = this._targets[0].index();
                else if (action.isForOpponent()) {
                    const randomTarget = source.opponentsUnit().randomTarget();
                    if (randomTarget) targetIndex = randomTarget.index();
                }
                
                console.log(`[Sec] 协战入队: ${observer.name()} 技能${skillId}`);
                
                // Push 到队列
                this._secReactionQueue.push({
                    observer: observer,
                    skillId: skillId,
                    targetIndex: targetIndex
                });
                
                // 移除 return，允许同一角色多个技能同时触发
                // return; 
            }
        }
    };

    // 识破检查 (同样只负责 Push)
    BattleManager.checkReaction = function(observer, source, action) {
        const note = _Sec_GetBattlerNotes(observer);
        const matches = note.matchAll(/<敌方识破[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any' && !action.isGuard()) matchType = true;
            else if (type === 'support' && (action.isForFriend() || action.isRecover()) && !action.isGuard()) matchType = true;
            else if (type === 'attack' && action.isAttack() && action.isForOpponent() && !action.isGuard()) matchType = true;

            if (matchType && Math.random() * 100 < chance) {
                const reactionSkill = $dataSkills[skillId];
                let targetIndex = -1;
                if (reactionSkill) {
                    if ([1, 2, 3, 4, 5, 6].includes(reactionSkill.scope)) targetIndex = source.index();
                    else targetIndex = observer.index();
                }
                console.log(`[Sec] 识破入队: ${observer.name()}`);
                
                this._secReactionQueue.push({
                    observer: observer,
                    skillId: skillId,
                    targetIndex: targetIndex
                });
                // return; // 同样允许连环识破
            }
        }
    };

})();