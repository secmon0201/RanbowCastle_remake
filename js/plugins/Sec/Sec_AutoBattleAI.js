/*:
 * @target MZ
 * @plugindesc [战斗] 智能自动战斗 AI (v24.0 最终定稿版)
 * @author AI Architect
 * @orderAfter Sec_BattleSystemInstance
 * @orderAfter Sec_BattleTimeline
 *
 * @help
 * ============================================================================
 * 这是一个深度适配 Sec_BattleSystemInstance.js 的战术 AI。
 * 经过全代码逻辑审查，修复了数值爆炸隐患，实现了完美的时空战术平衡。
 *
 * 【v24.0 最终逻辑确认】
 * 1. 拉条 > 推条 (Pull Priority):
 * - 拉条基础分 (4000) >> 推条平均分 (约 600)。
 * - 只有当推条能触发 [无限连动] (+5000) 时，推条优先级才会反超普通拉条。
 * - 如果拉条能触发 [队友斩杀]，拉条评分会进一步暴涨，确保斩杀优先。
 *
 * 2. 智能推条 (Smart Push):
 * - 修正了威胁度计算。AI 不再会因为敌人有 <AI_Threat: 2000> 标记而算出
 * 几十万的推条分。现在标记怪的推条收益倍率为 x2.0。
 * - 优先推：跑得慢的、威胁大的 (倍率高 / 速度低)。
 * - 放弃推：跑得太快的 (推了也没用)。
 *
 * 3. 核心机制闭环：
 * - 蓄力保护：严禁覆盖蓄力状态。
 * - 治疗计算：严禁满血治疗，救命奶权重极高。
 * - 连招铺垫：没Buff时优先种地，有Buff时优先收割。
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
 * @param ---Control Settings---
 * @text [AI: 时空战术]
 * @default
 *
 * @param WeightPullBase
 * @parent ---Control Settings---
 * @text 拉条基础分
 * @desc 拉条行为的固定加分 (建议 > 推条收益)。
 * @type number
 * @default 4000
 *
 * @param WeightPushBase
 * @parent ---Control Settings---
 * @text 推条单位分
 * @desc 推后敌人 1 tick 的价值 (受倍率修正)。
 * @type number
 * @default 20
 *
 * @param WeightLock
 * @parent ---Control Settings---
 * @text 永动压制分
 * @desc 达成无限推条时的额外加分。
 * @type number
 * @default 5000
 *
 * @param WeightPullInherit
 * @parent ---Control Settings---
 * @text 拉条继承率 (%)
 * @desc 继承队友潜在最高收益的比例。
 * @type number
 * @default 100
 *
 * @param ---Thresholds---
 * @text [AI: 心理阈值]
 * @default
 *
 * @param HpCrisis
 * @parent ---Thresholds---
 * @text 濒死警戒线 (%)
 * @type number
 * @default 40
 *
 * @param HpHeal
 * @parent ---Thresholds---
 * @text 起奶安全线 (%)
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
 * @type number
 * @default 1.5
 *
 * @param HealCritMult
 * @parent ---Balance Settings---
 * @text [倍率] 濒死回血价值
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
 * @desc 只要有推拉效果就给的基础分。
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
 * @param ---Cost Settings---
 * @text [AI: 资源性价比]
 * @default
 *
 * @param WeightMP
 * @parent ---Cost Settings---
 * @text MP 消耗惩罚
 * @type number
 * @default 5
 *
 * @param WeightTP
 * @parent ---Cost Settings---
 * @text TP 消耗惩罚
 * @type number
 * @default 10
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
        
        // 时空战术
        wPullBase: Number(parameters['WeightPullBase'] || 4000),
        wPushBase: Number(parameters['WeightPushBase'] || 20),
        wLock: Number(parameters['WeightLock'] || 5000),
        wPullInherit: Number(parameters['WeightPullInherit'] || 100) / 100,

        // 威胁度加分 (Targeting)
        wThreatTag: 2000,
        wThreatHealer: 1500,
        wPressure: 2500,

        // 消耗
        wMP: Number(parameters['WeightMP'] || 5),
        wTP: Number(parameters['WeightTP'] || 10),

        // 阈值
        hpCrisis: Number(parameters['HpCrisis'] || 40) / 100,
        hpHeal: Number(parameters['HpHeal'] || 80) / 100,
        
        // 平衡
        wDmgMult: Number(parameters['WeightDamage'] || 1.0),
        healNormMult: Number(parameters['HealNormMult'] || 1.5),
        healCritMult: Number(parameters['HealCritMult'] || 20.0),
        
        // 战术
        wHealCrisis: Number(parameters['WeightHealCrisis'] || 15000),
        wLethal: Number(parameters['WeightLethal'] || 10000),
        wCycle: Number(parameters['WeightCycle'] || 3500),
        wGuardian: Number(parameters['WeightGuardian'] || 3000),
        wControl: Number(parameters['WeightControl'] || 3000),
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

    // 2.3 真实治疗评分
    Game_Actor.prototype.secGetHealScore = function(target, healAmount) {
        if (!target || !target.isAlive()) return 0;
        let score = 0;
        const rate = target.hpRate();
        const mhp = target.mhp;
        const missingHp = mhp - target.hp;
        
        // 有效治疗量 (溢出不计)
        const effectiveHeal = Math.min(healAmount, missingHp);

        if (rate >= 1.0 || effectiveHeal <= 0) {
            score -= 500; 
        } 
        else if (rate < Conf.hpCrisis) {
            score += effectiveHeal * Conf.healCritMult;
        } 
        else if (rate < Conf.hpHeal) {
            score += effectiveHeal * Conf.healNormMult;
        } 
        else {
            score += effectiveHeal * 0.1; // 鼓励输出
        }
        return score;
    };

    Game_Actor.prototype.secCalcTotalHeal = function(skill, primaryTarget) {
        if (![3, 4].includes(skill.damage.type)) return 0;
        let totalHealScore = 0;
        let targets = [];
        if ([8, 10].includes(skill.scope)) { 
            targets = (skill.scope === 10) ? this.friendsUnit().deadMembers() : this.friendsUnit().aliveMembers();
        } else if (primaryTarget) { 
            targets = [primaryTarget];
        }
        for (const t of targets) {
            const healAmount = this.secEstimateBaseDamage(skill, t);
            if (healAmount <= 0) continue;
            if (t.isDead()) {
                if (skill.scope === 8 || skill.scope === 10) totalHealScore += healAmount * Conf.healCritMult * 2; 
                continue;
            }
            totalHealScore += this.secGetHealScore(t, healAmount);
        }
        return totalHealScore;
    };

    // 2.4 推条优先度乘数 (Push Multiplier) [v24.0 Corrected]
    // 这是一个返回 1.0 ~ 2.0 的倍率，用于推条计算，不用于加分
    Game_Actor.prototype.secGetPushPriorityMult = function(enemy) {
        let mult = 1.0;
        const data = enemy.enemy();
        
        // 1. 标记目标 (High Priority)
        if (data.meta && data.meta.AI_Threat) mult = 2.0;
        enemy.states().forEach(state => { if (state.meta.AI_Target) mult = 2.0; });

        // 2. 奶妈/辅助 (Medium Priority)
        if (data.actions) {
            const hasSupport = data.actions.some(action => {
                const skill = $dataSkills[action.skillId];
                return skill && ([3,4].includes(skill.damage.type) || skill.scope === 8 || skill.scope === 11);
            });
            if (hasSupport) mult = Math.max(mult, 1.5);
        }
        
        return mult;
    };

    // 2.5 攻击目标选择加分 (Targeting Additive Score)
    Game_Actor.prototype.secGetTargetingScore = function(enemy) {
        let score = 0;
        const data = enemy.enemy();

        // 1. 伤势压制
        score += (1.0 - enemy.hpRate()) * Conf.wPressure;

        // 2. 威胁标记
        if (data.meta && data.meta.AI_Threat) score += Number(data.meta.AI_Threat);
        enemy.states().forEach(state => { if (state.meta.AI_Target) score += Conf.wThreatTag; });

        // 3. 辅助识别
        if (data.actions) {
            const hasSupport = data.actions.some(action => {
                const skill = $dataSkills[action.skillId];
                return skill && ([3,4].includes(skill.damage.type));
            });
            if (hasSupport) score += Conf.wThreatHealer;
        }
        return score;
    };

    // 2.6 铺垫价值
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

    // 2.7 辅助: 光环/蓄力
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

    Game_Actor.prototype.secGetChargeStates = function() {
        const notes = [];
        if (this.actor()) notes.push(this.actor().note);
        if (this.currentClass()) notes.push(this.currentClass().note);
        this.equips().forEach(item => { if (item) notes.push(item.note); });
        this.states().forEach(state => { if (state) notes.push(state.note); });
        const stateIds = [];
        const regex = /<受击蓄力[:：]\s*(\d+)/g;
        for (const note of notes) {
            if (!note) continue;
            for (const match of note.matchAll(regex)) stateIds.push(parseInt(match[1]));
        }
        return stateIds;
    };

    Game_Actor.prototype.secCheckHardBan = function(skill) {
        const note = skill.note || "";
        const chargeStates = this.secGetChargeStates();
        if (chargeStates.length > 0) {
            for (const stateId of chargeStates) {
                if (this.isStateAffected(stateId)) {
                    if (skill.effects.some(e => e.code === 21 && e.dataId === stateId)) return true;
                    const cycleMatch = note.match(/<状态循环[:：]\s*([^>]+)\s*>/);
                    if (cycleMatch) {
                        const cycleIds = cycleMatch[1].split(/[,，]/).map(Number);
                        if (cycleIds.includes(stateId)) return true;
                    }
                }
            }
        }
        return false;
    };

    // 2.8 潜力与无限推条
    Game_Actor.prototype.secGetMaxPotentialScore = function() {
        let maxScore = 0;
        const skills = this.usableSkills().filter(item => item.id !== this.guardSkillId());
        for (const skill of skills) {
            let skillScore = 0;
            if ([3, 4].includes(skill.damage.type)) {
                skillScore = this.secCalcTotalHeal(skill, null);
            } else if ([1, 2, 5, 6].includes(skill.damage.type)) {
                const targets = this.opponentsUnit().aliveMembers();
                for (const t of targets) {
                    const dmg = this.secEstimateBaseDamage(skill, t);
                    let s = dmg * Conf.wDmgMult;
                    if (dmg >= t.hp) s += Conf.wLethal;
                    if (s > skillScore) skillScore = s;
                }
            }
            if (skillScore > maxScore) maxScore = skillScore;
        }
        return maxScore;
    };

    Game_Actor.prototype.secCheckInfiniteLock = function(target, pushTicks) {
        const mySpeed = this.tpbSpeed();
        const targetSpeed = target.tpbSpeed();
        if (mySpeed <= 0 || targetSpeed <= 0) return false;
        const timeRes = BattleManager.getTpbResolution ? BattleManager.getTpbResolution() : 10;
        const delayFrames = pushTicks / timeRes; 
        const refTime = BattleManager.isActiveTpb() ? 240 : 60;
        const myFrames = (1.0 / (mySpeed / refTime));
        const enemyFrames = ((1.0 - target.tpbChargeTime()) / (targetSpeed / refTime)) + delayFrames;
        return enemyFrames > myFrames;
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
                        const healAmt = Math.abs(val);
                        // [v19.0] 交互回血同样走加权逻辑
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

        // [v19.0] 资源消耗惩罚
        const costPenalty = (skill.mpCost * Conf.wMP) + (skill.tpCost * Conf.wTP);
        score -= costPenalty;

        // D. 战术修正
        score += this.secCheckSetupValue(skill, target);

        // [v24.0] 敌方价值全覆盖 (Corrected)
        if (target && target.isEnemy()) {
            score += this.secGetTargetingScore(target);
        }

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

        // [v22.0] 推拉条新逻辑
        const pushMatch = note.match(/<推条[:：]\s*(\d+)/);
        if (pushMatch && target && target.isEnemy()) {
            const ticks = parseInt(pushMatch[1]);
            // 推条乘数 (1.0~2.0)
            const threatMult = this.secGetPushPriorityMult(target);
            
            const avgSpd = $gameParty.tpbBaseSpeed ? $gameParty.tpbBaseSpeed() : 1;
            const spdFactor = Math.max(0.5, target.tpbSpeed() / avgSpd);
            
            score += (ticks * threatMult / spdFactor) * Conf.wPushBase;

            if (this.secCheckInfiniteLock(target, ticks)) {
                score += Conf.wLock;
            }
        }

        const pullMatch = note.match(/<拉条[:：]\s*(\d+)/);
        if (pullMatch && target && target.isActor()) {
            const potential = target.secGetMaxPotentialScore();
            score += potential * Conf.wPullInherit;
            score += Conf.wPullBase; 
        }

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