/*:
 * @target MZ
 * @plugindesc [战斗] 智能自动战斗 AI (v4.0 终极战术版)
 * @author AI Architect
 * @orderAfter Sec_BattleSystemInstance
 *
 * @help
 * ============================================================================
 * 这是一个拥有“全局伤害模拟”能力的战术级 AI。
 * 它不再依赖死板的权重，而是通过计算“期望总伤害”来做决策。
 *
 * 【v4.0 核心逻辑】
 * 1. 伤害模拟：
 * 总分 = 基础伤 + 机制伤(斩杀/蓄力) + 溅射伤(AOE) + 队友协战伤(Synergy)
 * AI 会选择【总分】最高的技能和目标。
 *
 * 2. 状态运营：
 * - <状态循环>: 没满层时优先叠层；满层后停止叠层，转为引爆。
 * - <状态交互>: 只有在伤害收益超过叠层收益，或能斩杀时才使用。
 *
 * 3. 力场共鸣：
 * - Spread (扩散): 场上感染人数少时，优先扩散。
 * - Gather (聚焦): 场上感染人数多时，优先聚焦爆发。
 *
 * 4. 智能辅助：
 * - 自动检测状态是否存在，杜绝重复上 Buff/开启光环。
 * - 蓄力期间绝不使用受击蓄力技能（保护蓄力池）。
 *
 * ============================================================================
 *
 * @param ---Button Settings---
 * @text [按钮设置]
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
 * @param ---Weights---
 * @text [战术修正]
 * @desc 虽然主要靠伤害计算，但治疗和控制仍需额外权重修正。
 * @default
 *
 * @param WeightHealCrisis
 * @parent ---Weights---
 * @text 救命治疗权重
 * @type number
 * @default 10000
 *
 * @param WeightControl
 * @parent ---Weights---
 * @text 控制/推拉权重
 * @type number
 * @default 3000
 *
 * @param WeightSpread
 * @parent ---Weights---
 * @text 扩散(Spread)战术分
 * @desc 当需要扩散状态时附加的战术分。
 * @type number
 * @default 2000
 *
 * @param WeightCycle
 * @parent ---Weights---
 * @text 叠层(Cycle)战术分
 * @desc 当状态未满层时附加的战术分。
 * @type number
 * @default 2500
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_AutoBattleAI";
    const parameters = PluginManager.parameters(pluginName);
    
    const Conf = {
        btnX: Number(parameters['ButtonX'] || 26),
        btnY: Number(parameters['ButtonY'] || 310),
        btnSize: Number(parameters['ButtonSize'] || 32),
        // 战术权重 (用于非伤害类决策)
        wHealCrisis: Number(parameters['WeightHealCrisis'] || 10000),
        wHealNormal: 2000,
        wControl: Number(parameters['WeightControl'] || 3000),
        wGuardian: 3000,
        wSpread: Number(parameters['WeightSpread'] || 2000),
        wCycle: Number(parameters['WeightCycle'] || 2500),
        // 阈值
        hpCrisis: 0.4,
        hpHeal: 0.7
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
    // 2. 核心计算引擎 (Calculator)
    // ======================================================================

    // 2.1 安全伤害估算
    Game_Actor.prototype.secEvalDamageFormula = function(formula, target, baseDamage) {
        try {
            const a = this;
            const b = target;
            const v = $gameVariables._data;
            const d = baseDamage || 0; 
            // 简单的沙盒模拟，替换 d 为数值
            // 注意：复杂的 JS 逻辑可能无法完美模拟，这里只做数值近似
            const value = eval(formula);
            return isNaN(value) ? 0 : Math.floor(value);
        } catch (e) {
            return 0;
        }
    };

    // 2.2 基础伤害模拟 (含属性/防御)
    Game_Actor.prototype.secEstimateBaseDamage = function(skill, target) {
        if (!skill.damage || skill.damage.type === 0) return 0;
        // 简化的伤害计算
        const a = this;
        const b = target;
        const v = $gameVariables._data;
        let value = 0;
        try {
            value = Math.max(eval(skill.damage.formula), 0);
        } catch (e) { return 0; }

        value *= target.elementRate(skill.damage.elementId);
        if (skill.damage.type === 1) value *= target.pdr; 
        if (skill.damage.type === 2) value *= target.mdr; 
        
        return Math.floor(value);
    };

    // 2.3 获取守护光环ID
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

    // 2.4 计算溅射总伤 (Splash Simulation)
    Game_Actor.prototype.secCalcSplashDamage = function(skill, mainTarget, baseDmg) {
        const note = skill.note;
        const splashMatch = note.match(/<溅射伤害[:：]\s*([^,，]+)\s*[,，]\s*(\d+)/);
        if (!splashMatch) return 0;

        const param1 = splashMatch[1].trim(); 
        const range = parseInt(splashMatch[2]);
        let totalSplash = 0;
        const friends = mainTarget.friendsUnit(); 
        const centerIndex = mainTarget.index();

        // 模拟溅射逻辑
        friends.members().forEach(n => {
            if (n !== mainTarget && n.isAlive() && Math.abs(n.index() - centerIndex) <= range) {
                let splashDmg = 0;
                if (!isNaN(param1) && !/[ab]\.|v\[/.test(param1) && parseFloat(param1) <= 5.0) {
                    splashDmg = baseDmg * parseFloat(param1);
                } else {
                    // 复杂公式估算
                    splashDmg = this.secEvalDamageFormula(param1, n, baseDmg);
                }
                totalSplash += splashDmg;
            }
        });
        return totalSplash;
    };

    // 2.5 计算协战收益 (Synergy Simulation)
    Game_Actor.prototype.secCalcSynergyDamage = function(skill, target) {
        let totalSynergyDmg = 0;
        const friends = this.friendsUnit().aliveMembers();
        
        // 判断当前技能类型
        const isAttack = skill.damage.type === 1 || skill.damage.type === 5;
        const isSupport = skill.damage.type === 0 || skill.damage.type === 3; // 简略判断

        for (const friend of friends) {
            if (friend === this) continue;
            const note = friend.actor().note; // 简化：只读Actor备注，需要更全面可读全部
            const matches = note.matchAll(/<队友协战[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
            
            for (const match of matches) {
                const type = match[1].trim().toLowerCase();
                const chance = parseInt(match[2]) / 100;
                const skillId = parseInt(match[3]);

                // 判定触发条件
                let triggered = false;
                if (type === 'any') triggered = true;
                else if (type === 'attack' && isAttack) triggered = true;
                else if (type === 'support' && isSupport) triggered = true;

                if (triggered) {
                    // 计算队友该技能的期望伤害
                    const synergySkill = $dataSkills[skillId];
                    // 假设队友攻击的是同一个目标(或随机)，取期望值
                    // 简单起见，计算打在 target 身上的伤害
                    const friendBase = friend.secEstimateBaseDamage(synergySkill, target);
                    totalSynergyDmg += (friendBase * chance);
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

        let bestAction = {
            skill: null,
            targetIndex: -1,
            score: -Infinity
        };

        // 遍历所有技能
        for (const skill of skills) {
            // 遍历所有可能的敌方目标 (如果是对敌技能)
            if (skill.scope === 1 || skill.scope === 2 || skill.scope === 3 || skill.scope === 4 || skill.scope === 5 || skill.scope === 6) {
                const targets = this.opponentsUnit().aliveMembers();
                for (const target of targets) {
                    const score = this.secCalculateTotalScore(skill, target);
                    if (score > bestAction.score) {
                        bestAction.skill = skill;
                        bestAction.targetIndex = target.index();
                        bestAction.score = score;
                    }
                }
            } 
            // 友方/全体目标
            else {
                // 对友技能简单处理 (选最需要的队友)
                const target = this.secFindBestFriendTarget(skill);
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

    // 辅助：找最佳队友目标
    Game_Actor.prototype.secFindBestFriendTarget = function(skill) {
        // 简单逻辑：如果是治疗，找血最少的；否则找自己或随机
        if ([3, 4].includes(skill.damage.type)) {
            return this.friendsUnit().aliveMembers().sort((a, b) => a.hpRate() - b.hpRate())[0];
        }
        return this;
    };

    // ======================================================================
    // 4. 全局评分函数 (The Brain)
    // ======================================================================
    Game_Actor.prototype.secCalculateTotalScore = function(skill, target) {
        let score = 0;
        const note = skill.note || "";
        const meta = skill.meta || {};

        // ------------------------------------------------------------
        // A. 基础 & 机制伤害计算 (Damage)
        // ------------------------------------------------------------
        let baseDmg = 0;
        let mechanicDmg = 0;

        // A1. 基础伤害
        if (target && target.isEnemy()) {
            baseDmg = this.secEstimateBaseDamage(skill, target);
        }

        // A2. 蓄力释放 (Release)
        const releaseMatch = note.match(/<蓄力释放[:：]\s*(\d+)\s*[,，]\s*([^>]+)>/);
        if (releaseMatch) {
            const stateId = parseInt(releaseMatch[1]);
            const formula = releaseMatch[2];
            if (this.isStateAffected(stateId) && this._secStoredDmg > 0) {
                const safeFormula = formula.replace(/\bd\b/g, String(this._secStoredDmg));
                mechanicDmg += this.secEvalDamageFormula(safeFormula, target, baseDmg);
            } else {
                return -500; // 没蓄力别放
            }
        }

        // A3. 斩杀追击 (Exec)
        const execMatch = note.match(/<斩杀追击[:：]\s*(\d+)\s*[,，]\s*([^>]+)>/);
        if (execMatch) {
            const formula = execMatch[2];
            // 计算追击伤害
            mechanicDmg += this.secEvalDamageFormula(formula, target, baseDmg);
        }

        // A4. 状态交互/力场共鸣 (Interact)
        const interactMatches = note.matchAll(/<(?:状态交互|力场共鸣)[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)/g);
        for (const match of interactMatches) {
            const stateId = parseInt(match[1]);
            //const mode = match[2]; // spread/gather
            const formula = match[3];
            
            // 如果是 Spread/Gather，逻辑稍有不同，这里简化为通用 Interact 伤害
            // 只要目标有状态，就计算额外伤害
            if (target && target.isStateAffected(stateId)) {
                mechanicDmg += this.secEvalDamageFormula(formula, target, baseDmg);
            }
        }

        // A5. 溅射/弹射总伤 (AOE)
        let aoeDmg = 0;
        if (target && target.isEnemy()) {
            aoeDmg += this.secCalcSplashDamage(skill, target, baseDmg);
            // 弹射比较难算，这里简化：如果有弹射，给一个预估值 (比如 Base * 2)
            if (note.match(/<弹射伤害[:：]/)) aoeDmg += baseDmg * 1.5; 
        }

        // A6. 协战收益 (Synergy)
        let synergyDmg = 0;
        if (target && target.isEnemy()) {
            synergyDmg = this.secCalcSynergyDamage(skill, target);
        }

        // --- 伤害汇总 ---
        const totalEstimatedDamage = baseDmg + mechanicDmg + aoeDmg + synergyDmg;
        score += totalEstimatedDamage; // 1伤害 = 1分 (简单直接)

        // ** 斩杀检测 **
        if (target && target.isEnemy()) {
            // 如果单体总伤 (Base + Mechanic) 足以斩杀，不需要管 AOE 和 协战
            const burstDmg = baseDmg + mechanicDmg; 
            if (burstDmg >= target.hp) {
                score += 10000; // 绝对优先斩杀
            }
        }

        // ------------------------------------------------------------
        // B. 战术修正 (Tactical)
        // ------------------------------------------------------------

        // B1. 蓄力保护 (Anti-Waste)
        const chargeMatch = note.match(/<受击蓄力[:：]\s*(\d+)/);
        if (chargeMatch) {
            const stateId = parseInt(chargeMatch[1]);
            if (this.isStateAffected(stateId)) return -5000; // 严禁重置蓄力
        }

        // B2. 守护光环 (Guardian)
        const guardianStates = this.secGetGuardianStates();
        if (guardianStates.length > 0) {
            const effect = skill.effects.find(e => e.code === 21 && guardianStates.includes(e.dataId));
            if (effect) {
                if (this.isStateAffected(effect.dataId)) return -5000; // 已开，勿重
                else score += Conf.wGuardian; // 必开
            }
        }

        // B3. Buff 防重 (Support Anti-Dup)
        const aiType = (meta.AI_Type || "").toLowerCase();
        if (aiType === 'support' || skill.scope === 0) { // Buff类
            // 检查技能是否施加状态
            skill.effects.forEach(e => {
                if (e.code === 21) {
                    // 如果目标已经有该Buff，大幅扣分
                    if (target && target.isStateAffected(e.dataId)) score -= 3000;
                    else score += 1000; // 有效Buff加分
                }
            });
        }

        // B4. 状态运营 (Cycle)
        const cycleMatch = note.match(/<状态循环[:：]\s*([^>]+)>/);
        if (cycleMatch && target) {
            const stateIds = cycleMatch[1].split(/[,，]/).map(Number);
            const currentIndex = stateIds.findIndex(id => target.isStateAffected(id));
            
            // 情况1: 还没满层 -> 鼓励叠层
            if (currentIndex < stateIds.length - 1) {
                score += Conf.wCycle; 
            }
            // 情况2: 已经满层 -> 叠层无意义，扣分 (除非它伤害特别高)
            else {
                score -= 1000; 
            }
        }

        // B5. 力场共鸣 (Spread vs Gather)
        const fieldMatch = note.match(/<力场共鸣[:：]\s*(\d+)\s*[,，]\s*([^,，]+)/);
        if (fieldMatch && target) {
            const stateId = parseInt(fieldMatch[1]);
            const mode = fieldMatch[2].trim().toLowerCase(); // spread / gather
            const enemies = this.opponentsUnit().aliveMembers();
            const infectedCount = enemies.filter(e => e.isStateAffected(stateId)).length;
            const totalCount = enemies.length;

            if (mode === 'spread') {
                // 感染率低时，Spread 价值高
                if (infectedCount < totalCount * 0.6) score += Conf.wSpread;
            } else if (mode === 'gather') {
                // 感染率高时，Gather 价值高 (伤害在上面A4已经算过了，这里给战术分)
                if (infectedCount >= totalCount * 0.5) score += 1000;
            }
        }

        // B6. 治疗 (Heal)
        if (aiType === 'heal' || [3, 4].includes(skill.damage.type)) {
            if (target && target.isActor()) {
                if (target.hpRate() < Conf.hpCrisis) score += Conf.wHealCrisis;
                else if (target.hpRate() < Conf.hpHeal) score += Conf.wHealNormal;
                else score -= 5000; // 满血别奶
            }
        }

        // B7. 控制 (Push/Pull)
        if (note.match(/<(推条|拉条)[:：]/)) score += Conf.wControl;

        return score;
    };

    // 视图层保持不变 (Sprite_AutoButton)
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