/*:
 * @target MZ
 * @plugindesc [战斗] 智能自动战斗 AI (v2.2 光环觉醒版)
 * @author AI Architect
 * @orderAfter Sec_BattleSystemInstance
 *
 * @help
 * ============================================================================
 * 这是一个深度适配 Sec_BattleSystemInstance.js 的智能 AI。
 * 它能看懂您设计的复杂技能机制，并做出合理的战术选择。
 *
 * 【v2.2 新增：守护光环识别】
 * AI 会自动检测角色/职业/装备中的 <守护光环: 状态ID...> 标签。
 * - 如果角色没有该状态：能附加该状态的技能优先级 +3000 (极高)。
 * - 如果角色已有该状态：能附加该状态的技能优先级 -5000 (禁止使用)。
 *
 * 【AI 智能决策逻辑】
 * 1. 守护光环：没开必开，开了不放。
 * 2. 斩杀逻辑：检测 <斩杀追击>，残血必杀。
 * 3. Combo 逻辑：检测 <状态交互> / <力场共鸣>，有配合优先放。
 * 4. 救命逻辑：检测 <技能吸血>，残血吸血。
 * 5. 群伤/控制：检测 <溅射/弹射> 及 <推拉条>。
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
 * @param ---AI Thresholds---
 * @text [AI 阈值设置]
 * @default
 *
 * @param HpCrisis
 * @parent ---AI Thresholds---
 * @text 紧急治疗线 (%)
 * @desc 队友血量低于此值时，触发“救命”级治疗权重。
 * @type number
 * @default 40
 *
 * @param HpHeal
 * @parent ---AI Thresholds---
 * @text 普通治疗线 (%)
 * @desc 队友血量低于此值时，触发“补血”级治疗权重。
 * @type number
 * @default 70
 *
 * @param ---AI Weights---
 * @text [AI 权重设置]
 * @desc 权重越高，AI 越倾向于选择该技能。
 * @default
 *
 * @param WeightGuardian
 * @parent ---AI Weights---
 * @text 守护光环权重
 * @desc 开启守护/姿态类状态的优先级。
 * @type number
 * @default 3000
 *
 * @param WeightKill
 * @parent ---AI Weights---
 * @text 斩杀权重
 * @desc 发现可斩杀目标时增加的权重。
 * @type number
 * @default 3000
 *
 * @param WeightControl
 * @parent ---AI Weights---
 * @text 控制/推拉权重
 * @desc 推条/拉条/召唤技能的权重。
 * @type number
 * @default 2500
 *
 * @param WeightCombo
 * @parent ---AI Weights---
 * @text 连招/状态交互权重
 * @desc 发现可触发状态交互(Combo)时增加的权重。
 * @type number
 * @default 2000
 *
 * @param WeightSupportFirst
 * @parent ---AI Weights---
 * @text 首回合辅助权重
 * @desc 战斗前两回合释放 Buff/Debuff 的权重。
 * @type number
 * @default 2000
 *
 * @param WeightHealCrisis
 * @parent ---AI Weights---
 * @text 救命治疗权重
 * @desc 队友濒死时治疗技能的权重。
 * @type number
 * @default 5000
 *
 * @param WeightHealNormal
 * @parent ---AI Weights---
 * @text 普通治疗权重
 * @desc 队友受伤时治疗技能的权重。
 * @type number
 * @default 1500
 *
 * @param WeightDrain
 * @parent ---AI Weights---
 * @text 吸血自救权重
 * @desc 自身残血时使用吸血技能的权重。
 * @type number
 * @default 1500
 *
 * @param WeightAOE
 * @parent ---AI Weights---
 * @text 群伤/弹射权重
 * @desc 溅射、弹射等 AOE 技能的基础权重。
 * @type number
 * @default 800
 *
 * @param WeightCustom
 * @parent ---AI Weights---
 * @text 自定义脚本权重
 * @desc 带有 <CustomEffect> 标签的技能权重。
 * @type number
 * @default 300
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_AutoBattleAI";
    const parameters = PluginManager.parameters(pluginName);
    
    // 参数读取与封装
    const Conf = {
        btnX: Number(parameters['ButtonX'] || 26),
        btnY: Number(parameters['ButtonY'] || 310),
        btnSize: Number(parameters['ButtonSize'] || 32),
        // 阈值
        hpCrisis: Number(parameters['HpCrisis'] || 40) / 100,
        hpHeal: Number(parameters['HpHeal'] || 70) / 100,
        // 权重
        wGuardian: Number(parameters['WeightGuardian'] || 3000),
        wKill: Number(parameters['WeightKill'] || 3000),
        wControl: Number(parameters['WeightControl'] || 2500),
        wCombo: Number(parameters['WeightCombo'] || 2000),
        wSupportFirst: Number(parameters['WeightSupportFirst'] || 2000),
        wHealCrisis: Number(parameters['WeightHealCrisis'] || 5000),
        wHealNormal: Number(parameters['WeightHealNormal'] || 1500),
        wDrain: Number(parameters['WeightDrain'] || 1500),
        wAOE: Number(parameters['WeightAOE'] || 800),
        wCustom: Number(parameters['WeightCustom'] || 300)
    };

    // ======================================================================
    // 1. 系统核心
    // ======================================================================
    
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._secAutoBattle = false;
    };

    Game_System.prototype.isSecAutoBattle = function() {
        return this._secAutoBattle;
    };

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
    // 2. AI 决策核心 (重写)
    // ======================================================================

    // 辅助：获取角色需要的“守护状态ID”列表
    Game_Actor.prototype.secGetGuardianStates = function() {
        const notes = [];
        // 扫描 Actor, Class, Equips (States 也可以扫，但通常光环定义在人身上)
        if (this.actor()) notes.push(this.actor().note);
        if (this.currentClass()) notes.push(this.currentClass().note);
        this.equips().forEach(item => { if (item) notes.push(item.note); });
        
        const stateIds = [];
        // 匹配 <守护光环: 50...>
        const regex = /<守护光环[:：]\s*(\d+)/g;
        
        for (const note of notes) {
            if (!note) continue;
            for (const match of note.matchAll(regex)) {
                stateIds.push(parseInt(match[1]));
            }
        }
        return stateIds;
    };

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

        if (skills.length === 0) {
            action.setAttack();
            return;
        }

        let bestSkill = null;
        let maxScore = -Infinity;
        let bestSkillTargetIndex = -1; 

        for (const skill of skills) {
            const result = this.secEvaluateSkill(skill);
            if (result.score > maxScore) {
                maxScore = result.score;
                bestSkill = skill;
                bestSkillTargetIndex = result.targetIndex;
            }
        }

        if (bestSkill) {
            action.setSkill(bestSkill.id);
            if (action.needsSelection()) {
                if (bestSkillTargetIndex >= 0) {
                    action.setTarget(bestSkillTargetIndex);
                } else {
                    this.secSetAutoTarget(action);
                }
            }
        } else {
            action.setAttack();
        }
    };

    // --- 核心评分算法 ---
    Game_Actor.prototype.secEvaluateSkill = function(skill) {
        let score = 0;
        let targetIndex = -1; 
        const note = skill.note || "";
        const meta = skill.meta || {};
        
        // 0. 手动权重
        if (meta.AI_Priority) score += Number(meta.AI_Priority);

        // 获取手动标签
        let aiType = (meta.AI_Type || "").trim().toLowerCase();

        // ============================================================
        // A. 守护光环 (Guardian Aura) - 核心逻辑 [NEW]
        // ============================================================
        const guardianStates = this.secGetGuardianStates();
        if (guardianStates.length > 0) {
            // 检查该技能是否附加了其中一个状态 (code 21 = Add State)
            const effect = skill.effects.find(e => e.code === 21 && guardianStates.includes(e.dataId));
            if (effect) {
                const stateId = effect.dataId;
                if (this.isStateAffected(stateId)) {
                    score -= 5000; // 已有状态，禁止重复释放
                } else {
                    score += Conf.wGuardian; // 开启光环！
                    aiType = 'buff';
                }
            }
        }

        // ============================================================
        // B. 机制识别
        // ============================================================
        // 1. 召唤
        if (note.match(/<Summon(Force|Unique)[:：]/i)) {
            if ($gameTroop.aliveMembers().length < 8) {
                aiType = 'summon';
            } else {
                score -= 1000; 
            }
        }

        // 2. 回溯
        if (note.match(/<Snapshot[:：]\s*Restore/i)) {
            if (this.hpRate() < 0.6) {
                aiType = 'heal'; 
                score += 500; 
            } else {
                score -= 500; 
            }
        }

        // 3. 自定义脚本
        if (note.match(/<CustomEffect[:：]/i)) {
            score += Conf.wCustom; 
        }

        // ============================================================
        // C. 战术判定
        // ============================================================
        
        // 1. 斩杀 (Kill)
        const execMatch = note.match(/<斩杀追击[:：]\s*(\d+)/);
        if (execMatch) {
            const threshold = parseInt(execMatch[1]) / 100;
            const targets = this.opponentsUnit().aliveMembers();
            const killTarget = targets.find(e => e.hpRate() <= threshold);
            if (killTarget) {
                score += Conf.wKill; 
                targetIndex = killTarget.index(); 
            }
        }

        // 2. 状态 Combo (Interaction)
        const stateMatches = note.matchAll(/<(?:状态交互|力场共鸣)[:：]\s*(\d+)/g);
        for (const match of stateMatches) {
            const stateId = parseInt(match[1]);
            const targets = this.opponentsUnit().aliveMembers();
            const comboTarget = targets.find(e => e.isStateAffected(stateId));
            if (comboTarget) {
                score += Conf.wCombo; 
                if (targetIndex === -1) targetIndex = comboTarget.index();
            }
        }

        // 3. 吸血自救 (Drain)
        if (note.match(/<技能吸血[:：]/)) {
            if (this.hpRate() < 0.5) {
                score += Conf.wDrain; 
            }
        }

        // 4. 群伤/弹射 (AOE)
        if (note.match(/<(溅射|弹射)伤害[:：]/)) {
            score += Conf.wAOE; 
        }

        // 5. 控制/推拉 (Control)
        if (note.match(/<(推条|拉条)[:：]/) || aiType === 'summon' || aiType === 'push' || aiType === 'pull') {
            score += Conf.wControl; 
        }

        // 6. 治疗 (Heal)
        if (aiType === 'heal' || [3, 4].includes(skill.damage.type)) {
            const friends = this.friendsUnit().aliveMembers();
            const crisis = friends.some(m => m.hpRate() < Conf.hpCrisis);
            const hurt = friends.some(m => m.hpRate() < Conf.hpHeal);

            if (crisis) score += Conf.wHealCrisis;      
            else if (hurt) score += Conf.wHealNormal;   
            else score -= 2000;             
        }

        // 7. 辅助 (Support)
        if (aiType === 'support' || skill.scope === 0) { 
            if ($gameTroop.turnCount() <= 1) score += Conf.wSupportFirst;
            else score += 500;
        }

        // 8. 普攻保底
        if (skill.id === this.attackSkillId()) {
            score += 100; 
        }

        return { score, targetIndex };
    };

    Game_Actor.prototype.secSetAutoTarget = function(action) {
        if (action.isForFriend()) {
            const target = this.friendsUnit().aliveMembers().sort((a, b) => a.hpRate() - b.hpRate())[0];
            if (target) action.setTarget(target.index());
        } else if (action.isForOpponent()) {
            action.decideRandomTarget();
        }
    };

    // ======================================================================
    // 3. 视图层
    // ======================================================================
    
    class Sprite_AutoButton extends Sprite_Clickable {
        initialize() {
            super.initialize();
            this._windowskin = ImageManager.loadSystem("Window");
            this._size = Conf.btnSize;
            this.x = Conf.btnX;
            this.y = Conf.btnY;
            this.anchor.set(0.5);
            this.createBitmap();
            
            if (!this._windowskin.isReady()) {
                this._windowskin.addLoadListener(this.refresh.bind(this));
            } else {
                this.refresh();
            }
        }

        createBitmap() {
            this.bitmap = new Bitmap(this._size, this._size);
        }

        update() {
            super.update();
            const isActive = $gameSystem.isSecAutoBattle();
            this.opacity = isActive ? 255 : 150;
            if (isActive) {
                this.scale.x = 1 + Math.sin(Date.now() / 200) * 0.05;
                this.scale.y = this.scale.x;
            } else {
                this.scale.x = 1;
                this.scale.y = 1;
            }
        }

        onClick() {
            const newState = $gameSystem.toggleSecAutoBattle();
            SoundManager.playOk();
            if (newState && BattleManager.isInputting()) {
                BattleManager.startActorInput();
            }
        }

        refresh() {
            if (!this._windowskin.isReady()) return;

            const w = this._size;
            const h = this._size;
            const ctx = this.bitmap.context;
            
            this.bitmap.clear();

            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(2, 2, w - 4, h - 4);

            const m = 24; 
            const drawM = Math.min(m, w / 2); 
            const drawFrame = (sx, sy, sw, sh, dx, dy, dw, dh) => {
                this.bitmap.blt(this._windowskin, sx, sy, sw, sh, dx, dy, dw, dh);
            };
            drawFrame(96, 0, m, m, 0, 0, drawM, drawM); 
            drawFrame(96 + 96 - m, 0, m, m, w - drawM, 0, drawM, drawM);
            drawFrame(96, 96 - m, m, m, 0, h - drawM, drawM, drawM); 
            drawFrame(96 + 96 - m, 96 - m, m, m, w - drawM, h - drawM, drawM, drawM);
            drawFrame(96 + m, 0, 96 - 2 * m, m, drawM, 0, w - 2 * drawM, drawM);
            drawFrame(96 + m, 96 - m, 96 - 2 * m, m, drawM, h - drawM, w - 2 * drawM, drawM);
            drawFrame(96, m, m, 96 - 2 * m, 0, drawM, drawM, h - 2 * drawM);
            drawFrame(96 + 96 - m, m, m, 96 - 2 * m, w - drawM, drawM, drawM, h - 2 * drawM);

            this.bitmap.fontSize = Math.floor(h * 0.35); 
            this.bitmap.textColor = "#88FF88"; 
            this.bitmap.outlineColor = "rgba(0, 0, 0, 0.8)";
            this.bitmap.outlineWidth = 3;
            this.bitmap.drawText("AUTO", 0, 0, w, h, "center");
        }
    }

    // ======================================================================
    // 4. 场景整合
    // ======================================================================

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