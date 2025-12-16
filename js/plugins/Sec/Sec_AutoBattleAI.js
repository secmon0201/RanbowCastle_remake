/*:
 * @target MZ
 * @plugindesc [战斗] 智能自动战斗 AI (v19.0 续航大师版)
 * @author AI Architect
 * @orderAfter Sec_BattleSystemInstance
 *
 * @help
 * ============================================================================
 * 这是一个深度适配 Sec_BattleSystemInstance.js 的战术 AI。
 * v19.0 引入了资源消耗(MP/TP)计算，懂得“省蓝续航”，并完美支持普攻群奶流派。
 *
 * 【v19.0 核心进化】
 * 1. 性价比计算 (Cost Awareness)：
 * - 引入 MP/TP 惩罚机制。每消耗 1 点 MP，技能评分会扣除一定分数。
 * - 结果：在治疗量相近的情况下，AI 会绝对优先选择不耗蓝的技能 (如普攻触发连招)。
 * - 只有在“救命”时刻，高额的治疗加分才会压倒蓝耗的扣分。
 *
 * 2. 交互治疗“正名”：
 * - 普攻触发的状态交互回血 (Interact Heal)，现在完全享受 [濒死/普通] 治疗倍率加成。
 * - 系统会对比：[技能A群奶总量] vs [普攻触发Buff群奶总量]。
 * - 结合蓝耗计算，普攻流奶妈将展现出强大的续航智能。
 *
 * 3. 种地/收菜循环：
 * - 没Buff时：优先放技能上Buff (种地)。
 * - 有Buff时：上Buff技能扣分，优先用普攻触发回血 (收菜)。
 *
 * ============================================================================
 *
 * @param ---Button Settings---
 * @text [界面: 按钮设置]
 * @default
 *
 * @param ButtonX
 * @parent ---Button Settings---
 * @text 按钮 X 坐标
 * @type number
 * @default 26
 *
 * @param ButtonY
 * @parent ---Button Settings---
 * @text 按钮 Y 坐标
 * @type number
 * @default 310
 *
 * @param ButtonSize
 * @parent ---Button Settings---
 * @text 按钮尺寸
 * @type number
 * @default 32
 *
 * @param ---Cost Settings---
 * @text [AI: 资源性价比]
 * @desc 越高的惩罚值，AI 越抠门 (越喜欢用普攻)。
 * @default
 *
 * @param WeightMP
 * @parent ---Cost Settings---
 * @text MP 消耗惩罚
 * @desc 每消耗 1 点 MP 扣除的评分。
 * @type number
 * @default 20
 *
 * @param WeightTP
 * @parent ---Cost Settings---
 * @text TP 消耗惩罚
 * @desc 每消耗 1 点 TP 扣除的评分。
 * @type number
 * @default 10
 *
 * @param ---Thresholds---
 * @text [AI: 心理阈值]
 * @default
 *
 * @param HpCrisis
 * @parent ---Thresholds---
 * @text 濒死警戒线 (%)
 * @desc 队友血量低于此百分比时，进入救命模式。
 * @type number
 * @default 40
 *
 * @param HpHeal
 * @parent ---Thresholds---
 * @text 起奶安全线 (%)
 * @desc 队友血量高于此百分比时，不考虑普通治疗。
 * @type number
 * @default 80
 *
 * @param ---Balance Settings---
 * @text [AI: 数值平衡]
 * @default
 *
 * @param WeightDamage
 * @parent ---Balance Settings---
 * @text [倍率] 伤害价值
 * @type number
 * @default 1.0
 *
 * @param HealNormMult
 * @parent ---Balance Settings---
 * @text [倍率] 普通回血价值
 * @desc 建议 1.5。
 * @type number
 * @default 1.5
 *
 * @param HealCritMult
 * @parent ---Balance Settings---
 * @text [倍率] 濒死回血价值
 * @desc 建议 20.0。
 * @type number
 * @default 20.0
 *
 * @param ---Tactical Weights---
 * @text [AI: 战术倾向]
 * @default
 *
 * @param WeightHealCrisis
 * @parent ---Tactical Weights---
 * @text [极高] 救命优先权
 * @type number
 * @default 15000
 *
 * @param WeightLethal
 * @parent ---Tactical Weights---
 * @text [极高] 确杀优先权
 * @type number
 * @default 10000
 *
 * @param WeightCycle
 * @parent ---Tactical Weights---
 * @text [高] 叠层运营权重
 * @type number
 * @default 3500
 *
 * @param WeightControl
 * @parent ---Tactical Weights---
 * @text [高] 控制/推拉权重
 * @type number
 * @default 3000
 *
 * @param WeightGuardian
 * @parent ---Tactical Weights---
 * @text [高] 守护光环权重
 * @type number
 * @default 3000
 *
 * @param WeightSpread
 * @parent ---Tactical Weights---
 * @text [中] 扩散(Spread)战术分
 * @type number
 * @default 2500
 *
 * @param WeightSetup
 * @parent ---Tactical Weights---
 * @text [中] 铺垫(种地)战术分
 * @type number
 * @default 2000
 *
 * @param WeightRelease
 * @parent ---Tactical Weights---
 * @text [中] 蓄力释放战术分
 * @type number
 * @default 2000
 *
 * @param WeightCombo
 * @parent ---Tactical Weights---
 * @text [中] 引爆/交互基础分
 * @type number
 * @default 1500
 *
 * @param WeightComboSpecial
 * @parent ---Tactical Weights---
 * @text [中] 普攻群奶特权分
 * @desc 给予能触发连招的普攻额外加分。
 * @type number
 * @default 1000
 *
 * @param WeightBuffPerUnit
 * @parent ---Tactical Weights---
 * @text [低] 单人Buff收益分
 * @type number
 * @default 800
 *
 * @param WeightAOE
 * @parent ---Tactical Weights---
 * @text [低] AOE基础加分
 * @type number
 * @default 500
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_AutoBattleAI";
    const parameters = PluginManager.parameters(pluginName);
    
    // 参数配置
    const Conf = {
        btnX: Number(parameters['ButtonX'] || 26),
        btnY: Number(parameters['ButtonY'] || 310),
        btnSize: Number(parameters['ButtonSize'] || 32),
        
        // 消耗惩罚 [New v19.0]
        wMP: Number(parameters['WeightMP'] || 20),
        wTP: Number(parameters['WeightTP'] || 10),

        // 阈值
        hpCrisis: Number(parameters['HpCrisis'] || 40) / 100,
        hpHeal: Number(parameters['HpHeal'] || 80) / 100,
        
        // 平衡
        wDmgMult: Number(parameters['WeightDamage'] || 1.0),
        healNormMult: Number(parameters['HealNormMult'] || 1.5),
        healCritMult: Number(parameters['HealCritMult'] || 20.0),
        
        // 战术权重
        wHealCrisis: Number(parameters['WeightHealCrisis'] || 15000),
        wLethal: Number(parameters['WeightLethal'] || 10000),
        wCycle: Number(parameters['WeightCycle'] || 3500),
        wControl: Number(parameters['WeightControl'] || 3000),
        wGuardian: Number(parameters['WeightGuardian'] || 3000),
        wSpread: Number(parameters['WeightSpread'] || 2500),
        wSetup: Number(parameters['WeightSetup'] || 2000),
        wRelease: Number(parameters['WeightRelease'] || 2000),
        wCombo: Number(parameters['WeightCombo'] || 1500),
        wComboSpecial: Number(parameters['WeightComboSpecial'] || 1000),
        wBuffPerUnit: Number(parameters['WeightBuffPerUnit'] || 800),
        wAOE: Number(parameters['WeightAOE'] || 500)
    };

    // ======================================================================
    // 1. 系统核心
    // ======================================================================
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._secAutoBattle = false;
    };
    Game_System.prototype.isSecAutoBattle = function() { return this._secAutoBattle; };
    Game_System.prototype.toggleSecAutoBattle = function() {
        this._secAutoBattle = !this._secAutoBattle;
        return this._secAutoBattle;
    };

    const _BattleManager_startActorInput = BattleManager.startActorInput;
    BattleManager.startActorInput = function() {
        if ($gameSystem.isSecAutoBattle() && this._currentActor && this._currentActor.canInput()) {
            this._currentActor.makeSecAutoActions();
            this.selectNextCommand();
        } else {
            _BattleManager_startActorInput.call(this);
        }
    };

    // ======================================================================
    // 2. 核心计算引擎
    // ======================================================================

    // 2.1 安全公式计算
    Game_Actor.prototype.secEvalFormula = function(formula, context) {
        try {
            const a = context.a || this;
            const b = context.b;
            if (!b) return 0;

            const v = $gameVariables._data;
            const d = context.d !== undefined ? context.d : 0;
            const dmg = d; 
            const damage = d;
            const origin = context.origin || b;

            const value = eval(formula);
            return isNaN(value) ? 0 : Math.floor(value);
        } catch (e) {
            return 0;
        }
    };

    // 2.2 基础伤害估算
    Game_Actor.prototype.secEstimateBaseDamage = function(skill, target) {
        if (!skill.damage || skill.damage.type === 0) return 0;
        
        const baseVal = this.secEvalFormula(skill.damage.formula, { a: this, b: target });
        let value = Math.abs(baseVal); 
        
        if ([1, 2, 5, 6].includes(skill.damage.type)) {
            value *= target.elementRate(skill.damage.elementId);
            if (skill.damage.type === 1) value *= target.pdr; 
            if (skill.damage.type === 2) value *= target.mdr; 
            if (target.isGuard()) value *= 0.5;
        }
        if ([3, 4].includes(skill.damage.type)) {
            value *= target.rec; 
        }

        return Math.floor(value);
    };

    // 2.3 通用治疗评分计算 (Score Calculator) [v19.0 Refactor]
    // 统一了标准回血和交互回血的评分标准
    Game_Actor.prototype.secGetHealScore = function(target, healAmount) {
        if (healAmount <= 0) return 0;
        
        // 死人
        if (target.isDead()) {
            // 这里假设外部已经判断了能否复活
            return healAmount * Conf.healCritMult * 2;
        }

        const rate = target.hpRate();
        let score = 0;

        // 满血溢出：扣分
        if (rate >= 1.0) {
            score -= 500; 
        } 
        // 濒死：极高分
        else if (rate < Conf.hpCrisis) {
            score += healAmount * Conf.healCritMult;
        } 
        // 受伤：正常分
        else if (rate < Conf.hpHeal) {
            score += healAmount * Conf.healNormMult;
        } 
        // 安全区：微量负分 (鼓励输出)
        else {
            score -= 50;
        }
        return score;
    };

    // 2.3.1 技能真实治疗量模拟
    Game_Actor.prototype.secCalcTotalHeal = function(skill, primaryTarget) {
        if (![3, 4].includes(skill.damage.type)) return 0;

        let totalScore = 0;
        let targets = [];

        if ([8, 10].includes(skill.scope)) { 
            targets = (skill.scope === 10) ? this.friendsUnit().deadMembers() : this.friendsUnit().aliveMembers();
        } else if (primaryTarget) { 
            targets = [primaryTarget];
        }

        for (const t of targets) {
            const healAmount = this.secEstimateBaseDamage(skill, t);
            totalScore += this.secGetHealScore(t, healAmount);
        }
        return totalScore;
    };

    // 2.4 铺垫价值检查 (Anti-Dup)
    Game_Actor.prototype.secCheckSetupValue = function(skill) {
        let setupScore = 0;
        
        const addedStates = [];
        skill.effects.forEach(e => {
            if (e.code === 21) addedStates.push(e.dataId);
        });
        if (addedStates.length === 0) return 0;

        let validTargetsCount = 0;
        const scope = skill.scope;
        if ([8, 10].includes(scope)) {
            this.friendsUnit().members().forEach(m => {
                if (m.isAlive() && !addedStates.some(id => m.isStateAffected(id))) validTargetsCount++;
            });
        } else {
            const friends = this.friendsUnit().aliveMembers();
            if (friends.some(m => !addedStates.some(id => m.isStateAffected(id)))) validTargetsCount = 1;
        }

        if (validTargetsCount === 0) return -5000;

        const checkSkills = [this.attackSkillId(), ...this._skills].filter(id => id !== skill.id);
        const uniqueSkills = [...new Set(checkSkills)];

        for (const sId of uniqueSkills) {
            const s = $dataSkills[sId];
            if (!s) continue;
            const note = s.note;
            for (const stateId of addedStates) {
                const regex = new RegExp(`<状态交互[:：]\\s*${stateId}\\s*[,，]`, "i");
                if (note.match(regex)) {
                    setupScore += Conf.wSetup;
                    if (sId === this.attackSkillId() && note.includes("allallies")) {
                        setupScore += Conf.wComboSpecial; 
                    }
                }
            }
        }
        return setupScore;
    };

    // 2.5 辅助: 光环ID
    Game_Actor.prototype.secGetGuardianStates = function() {
        const notes = [];
        if (this.actor()) notes.push(this.actor().note);
        if (this.currentClass()) notes.push(this.currentClass().note);
        this.equips().forEach(item => { if (item) notes.push(item.note); });
        const stateIds = [];
        const regex = /<守护光环[:：]\s*(\d+)/g;
        for (const note of notes) {
            if (!note) continue;
            for (const match of note.matchAll(regex)) stateIds.push(parseInt(match[1]));
        }
        return stateIds;
    };

    // [v17.0 Update] 绝对禁忌检查
    Game_Actor.prototype.secCheckHardBan = function(skill) {
        const note = skill.note || "";
        const chargeMatch = note.match(/<受击蓄力[:：]\s*(\d+)/);
        if (chargeMatch) {
            const stateId = parseInt(chargeMatch[1]);
            if (this.isStateAffected(stateId)) return true; 
        }
        return false;
    };

    // ... AOE 模拟 ...
    Game_Actor.prototype.secCalcSplashDamage = function(skill, mainTarget, baseDmg) {
        const note = skill.note;
        const splashMatch = note.match(/<溅射伤害[:：]\s*([^,，]+)\s*[,，]\s*(\d+)/);
        if (!splashMatch) return 0;
        const param1 = splashMatch[1].trim(); 
        const range = parseInt(splashMatch[2]);
        let totalSplash = 0;
        const friends = mainTarget.friendsUnit(); 
        const centerIndex = mainTarget.index();
        friends.members().forEach(n => {
            if (n !== mainTarget && n.isAlive() && Math.abs(n.index() - centerIndex) <= range) {
                let splashDmg = 0;
                if (!isNaN(param1) && !/[ab]\.|v\[/.test(param1) && parseFloat(param1) <= 5.0) {
                    splashDmg = baseDmg * parseFloat(param1);
                } else {
                    splashDmg = this.secEvalFormula(param1, {
                        a: this, b: n, origin: mainTarget, d: baseDmg
                    });
                }
                totalSplash += splashDmg;
            }
        });
        return totalSplash;
    };

    Game_Actor.prototype.secCalcRicochetDamage = function(skill, firstTarget, baseDmg) {
        const note = skill.note;
        const ricoMatch = note.match(/<弹射伤害[:：]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*(\d+)/);
        if (!ricoMatch) return 0;
        const initFormula = ricoMatch[1];
        const nextFormula = ricoMatch[2];
        const maxBounces = parseInt(ricoMatch[3]);
        const allEnemies = this.opponentsUnit().aliveMembers();
        if (allEnemies.length === 0) return 0;
        let totalRicoDmg = 0;
        let lastDamage = baseDmg; 
        const loops = Math.min(maxBounces, 5); 
        for (let i = 0; i < loops; i++) {
            const targetSample = allEnemies[i % allEnemies.length];
            const formulaToUse = (i === 0) ? initFormula : nextFormula;
            const currentDmg = this.secEvalFormula(formulaToUse, {
                a: this, b: targetSample, d: lastDamage
            });
            totalRicoDmg += currentDmg;
            lastDamage = currentDmg;
            if (lastDamage <= 0) break;
        }
        return totalRicoDmg;
    };

    Game_Actor.prototype.secCalcSynergyDamage = function(skill, target) {
        let totalSynergyDmg = 0;
        const friends = this.friendsUnit().aliveMembers();
        const isAttack = skill.damage.type === 1 || skill.damage.type === 5;
        const isSupport = skill.damage.type === 0 || skill.damage.type === 3;
        for (const friend of friends) {
            if (friend === this) continue;
            const note = friend.actor().note; 
            const matches = note.matchAll(/<队友协战[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
            for (const match of matches) {
                const type = match[1].trim().toLowerCase();
                const chance = parseInt(match[2]) / 100;
                const skillId = parseInt(match[3]);
                let triggered = false;
                if (type === 'any') triggered = true;
                else if (type === 'attack' && isAttack) triggered = true;
                else if (type === 'support' && isSupport) triggered = true;
                if (triggered) {
                    const synergySkill = $dataSkills[skillId];
                    if (synergySkill) {
                        const friendBase = friend.secEstimateBaseDamage(synergySkill, target);
                        totalSynergyDmg += (friendBase * chance);
                    }
                }
            }
        }
        return totalSynergyDmg;
    };

    // ======================================================================
    // 3. AI 决策主循环
    // ======================================================================
    Game_Actor.prototype.makeSecAutoActions = function() {
        this.clearActions();
        if (this.canMove()) {
            const actionTimes = this.makeActionTimes();
            for (let i = 0; i < actionTimes; i++) {
                const action = new Game_Action(this);
                this.secMakeAutoBattleAction(action);
                this.setAction(i, action);
            }
        }
        this.setActionState("waiting");
    };

    Game_Actor.prototype.secMakeAutoBattleAction = function(action) {
        let skills = this.usableSkills();
        skills = skills.filter(item => item.id !== this.guardSkillId());
        if (skills.length === 0) { action.setAttack(); return; }

        let bestAction = { skill: null, targetIndex: -1, score: -Infinity };

        for (const skill of skills) {
            // 对敌
            if ([1, 2, 3, 4, 5, 6].includes(skill.scope)) {
                const targets = this.opponentsUnit().aliveMembers();
                for (const target of targets) {
                    const score = this.secCalculateTotalScore(skill, target);
                    if (score > bestAction.score) {
                        bestAction.skill = skill;
                        bestAction.targetIndex = target.index();
                        bestAction.score = score;
                    }
                }
            } else {
                let target = null;
                if (skill.scope === 8 || skill.scope === 10) target = this.secFindDeadFriendTarget();
                else if ([7, 9].includes(skill.scope)) target = this.secFindBestFriendTarget(skill);
                
                const score = this.secCalculateTotalScore(skill, target);
                if (score > bestAction.score) {
                    bestAction.skill = skill;
                    bestAction.targetIndex = target ? target.index() : -1;
                    bestAction.score = score;
                }
            }
        }

        if (bestAction.skill) {
            action.setSkill(bestAction.skill.id);
            if (bestAction.targetIndex !== -1) {
                action.setTarget(bestAction.targetIndex);
            }
        } else {
            action.setAttack();
        }
    };

    Game_Actor.prototype.secFindDeadFriendTarget = function() {
        const deads = this.friendsUnit().deadMembers();
        if (deads.length === 0) return null;
        return deads.sort((a, b) => b.atk - a.atk)[0];
    };

    Game_Actor.prototype.secFindBestFriendTarget = function(skill) {
        if ([3, 4].includes(skill.damage.type)) {
            return this.friendsUnit().aliveMembers().sort((a, b) => a.hpRate() - b.hpRate())[0];
        }
        return this.friendsUnit().aliveMembers().sort((a, b) => b.atk - a.atk)[0];
    };

    // ======================================================================
    // 4. 全局评分函数 (The Brain)
    // ======================================================================
    Game_Actor.prototype.secCalculateTotalScore = function(skill, target) {
        if (this.secCheckHardBan(skill)) return -999999;

        let score = 0;
        const note = skill.note || "";
        const meta = skill.meta || {};

        let baseDmg = 0;
        let mechanicDmg = 0;

        // A. 基础伤害
        if (target && target.isEnemy()) {
            baseDmg = this.secEstimateBaseDamage(skill, target);
            score += baseDmg * Conf.wDmgMult;
        }

        // B. 机制伤害
        const releaseMatch = note.match(/<蓄力释放[:：]\s*(\d+)\s*[,，]\s*([^>]+)>/);
        if (releaseMatch) {
            const stateId = parseInt(releaseMatch[1]);
            const formula = releaseMatch[2];
            if (this.isStateAffected(stateId) && this._secStoredDmg > 0) {
                const safeFormula = formula.replace(/\bd\b/g, String(this._secStoredDmg));
                mechanicDmg += this.secEvalFormula(safeFormula, { a: this, b: target, d: this._secStoredDmg });
                score += Conf.wRelease; 
            } else {
                return -999999;
            }
        }

        const execMatch = note.match(/<斩杀追击[:：]\s*(\d+)\s*[,，]\s*([^>]+)>/);
        if (execMatch) {
            const formula = execMatch[2];
            mechanicDmg += this.secEvalFormula(formula, { a: this, b: target, d: baseDmg });
        }

        const interactRegex = /<状态交互[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)>/g;
        for (const match of note.matchAll(interactRegex)) {
            const stateId = parseInt(match[1]);
            const formula = match[2];
            const rangeRaw = match[4].trim().toLowerCase();

            let scanList = [];
            if (rangeRaw.startsWith('allallies')) scanList = this.friendsUnit().aliveMembers();
            else if (target) scanList = [target];

            for (const t of scanList) {
                if (t.isStateAffected(stateId)) {
                    const val = this.secEvalFormula(formula, { a: this, b: t });
                    if (val > 0 && t.isEnemy()) {
                        mechanicDmg += val; 
                        score += Conf.wCombo;
                    } 
                    else if (val < 0 && t.isActor()) {
                        // [v19.0 Update] 交互回血，走正规治疗评分流程
                        const healAmt = Math.abs(val);
                        score += this.secGetHealScore(t, healAmt);
                        score += Conf.wCombo; 
                    }
                }
            }
        }

        const fieldRegex = /<力场共鸣[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]/g;
        for (const match of note.matchAll(fieldRegex)) {
            const stateId = parseInt(match[1]);
            const mode = match[2].trim().toLowerCase();
            const formula = match[3];
            
            const allBattlers = this.friendsUnit().aliveMembers().concat(this.opponentsUnit().aliveMembers());
            let infectedEnemies = 0;
            const totalEnemies = this.opponentsUnit().aliveMembers().length;

            for (const m of allBattlers) {
                if (m.isStateAffected(stateId)) {
                    if (m.isEnemy()) infectedEnemies++;
                    const val = this.secEvalFormula(formula, { a: this, b: m });
                    
                    if (val > 0 && m.isEnemy()) mechanicDmg += val;
                    else if (val < 0 && m.isActor()) {
                        const healAmt = Math.abs(val);
                        score += this.secGetHealScore(m, healAmt);
                    }
                }
            }

            if (mode === 'spread') {
                if (infectedEnemies < totalEnemies * 0.6) score += Conf.wSpread; 
            } else if (mode === 'gather') {
                if (infectedEnemies >= totalEnemies * 0.5) score += 1000;
            }
        }

        if (target && target.isEnemy()) {
            mechanicDmg += this.secCalcSplashDamage(skill, target, baseDmg);
            mechanicDmg += this.secCalcRicochetDamage(skill, target, baseDmg);
            mechanicDmg += this.secCalcSynergyDamage(skill, target);
        }

        score += mechanicDmg * Conf.wDmgMult;

        if (target && target.isEnemy()) {
            const burstDmg = baseDmg + mechanicDmg;
            if (burstDmg >= target.hp) {
                score += Conf.wLethal; 
            }
        }

        // C. 真实治疗计算
        const healScore = this.secCalcTotalHeal(skill, target);
        score += healScore;

        if ([3, 4].includes(skill.damage.type)) {
            const friends = this.friendsUnit().aliveMembers();
            if (friends.some(m => m.hpRate() < Conf.hpCrisis)) {
                score += Conf.wHealCrisis; 
            }
        }

        // [v19.0 Update] 资源消耗惩罚
        const costPenalty = (skill.mpCost * Conf.wMP) + (skill.tpCost * Conf.wTP);
        score -= costPenalty;

        // D. 战术修正
        score += this.secCheckSetupValue(skill, target);

        // 光环: 没开加分, 已开不扣分
        const guardianStates = this.secGetGuardianStates();
        if (guardianStates.length > 0) {
            const effect = skill.effects.find(e => e.code === 21 && guardianStates.includes(e.dataId));
            if (effect && !this.isStateAffected(effect.dataId)) {
                score += Conf.wGuardian; 
            }
        }

        const aiType = (meta.AI_Type || "").toLowerCase();
        if (aiType === 'support' || skill.scope === 0) {
            let validTargetsCount = 0;
            skill.effects.forEach(e => {
                if (e.code === 21) {
                    const buffId = e.dataId;
                    if ([8, 10].includes(skill.scope)) { 
                         this.friendsUnit().members().forEach(m => {
                             if (m.isAlive() && !m.isStateAffected(buffId)) validTargetsCount++;
                         });
                    } 
                    else if (target) {
                        if (!target.isStateAffected(buffId)) validTargetsCount++;
                    }
                }
            });
            if (validTargetsCount === 0) score -= 5000;
            else score += validTargetsCount * Conf.wBuffPerUnit;
        }

        const cycleMatch = note.match(/<状态循环[:：]\s*([^>]+)>/);
        if (cycleMatch && target) {
            const stateIds = cycleMatch[1].split(/[,，]/).map(Number);
            const currentIndex = stateIds.findIndex(id => target.isStateAffected(id));
            if (currentIndex < stateIds.length - 1) score += Conf.wCycle; 
            else if ((baseDmg + mechanicDmg) < 100) score -= 1000;
        }

        if (note.match(/<(推条|拉条)[:：]/)) score += Conf.wControl;
        if (meta.AI_Priority) score += Number(meta.AI_Priority);
        if (note.match(/<(溅射|弹射)伤害[:：]/)) score += Conf.wAOE;

        return score;
    };

    // 视图层
    class Sprite_AutoButton extends Sprite_Clickable {
        initialize() {
            super.initialize();
            this._windowskin = ImageManager.loadSystem("Window");
            this._size = Conf.btnSize;
            this.x = Conf.btnX;
            this.y = Conf.btnY;
            this.anchor.set(0.5);
            this.createBitmap();
            if (!this._windowskin.isReady()) this._windowskin.addLoadListener(this.refresh.bind(this));
            else this.refresh();
        }
        createBitmap() { this.bitmap = new Bitmap(this._size, this._size); }
        update() {
            super.update();
            const isActive = $gameSystem.isSecAutoBattle();
            this.opacity = isActive ? 255 : 150;
            if (isActive) {
                this.scale.x = 1 + Math.sin(Date.now() / 200) * 0.05;
                this.scale.y = this.scale.x;
            } else { this.scale.x = 1; this.scale.y = 1; }
        }
        onClick() {
            const newState = $gameSystem.toggleSecAutoBattle();
            SoundManager.playOk();
            if (newState && BattleManager.isInputting()) BattleManager.startActorInput();
        }
        refresh() {
            if (!this._windowskin.isReady()) return;
            const w = this._size; const h = this._size; const ctx = this.bitmap.context;
            this.bitmap.clear();
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(2, 2, w - 4, h - 4);
            const m = 24; const drawM = Math.min(m, w / 2); 
            const drawFrame = (sx, sy, sw, sh, dx, dy, dw, dh) => { this.bitmap.blt(this._windowskin, sx, sy, sw, sh, dx, dy, dw, dh); };
            drawFrame(96, 0, m, m, 0, 0, drawM, drawM); drawFrame(96 + 96 - m, 0, m, m, w - drawM, 0, drawM, drawM);
            drawFrame(96, 96 - m, m, m, 0, h - drawM, drawM, drawM); drawFrame(96 + 96 - m, 96 - m, m, m, w - drawM, h - drawM, drawM, drawM);
            drawFrame(96 + m, 0, 96 - 2 * m, m, drawM, 0, w - 2 * drawM, drawM); drawFrame(96 + m, 96 - m, 96 - 2 * m, m, drawM, h - drawM, w - 2 * drawM, drawM);
            drawFrame(96, m, m, 96 - 2 * m, 0, drawM, drawM, h - 2 * drawM); drawFrame(96 + 96 - m, m, m, 96 - 2 * m, w - drawM, drawM, drawM, h - 2 * drawM);
            this.bitmap.fontSize = Math.floor(h * 0.35); this.bitmap.textColor = "#88FF88"; 
            this.bitmap.outlineColor = "rgba(0, 0, 0, 0.8)"; this.bitmap.outlineWidth = 3;
            this.bitmap.drawText("AUTO", 0, 0, w, h, "center");
        }
    }
    const _Scene_Battle_createButtons = Scene_Battle.prototype.createButtons;
    Scene_Battle.prototype.createButtons = function() {
        _Scene_Battle_createButtons.call(this);
        this.createSecAutoButton();
    };
    Scene_Battle.prototype.createSecAutoButton = function() {
        this._secAutoButton = new Sprite_AutoButton();
        this.addWindow(this._secAutoButton);
    };
})();