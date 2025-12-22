/*:
 * @target MZ
 * @plugindesc [战斗] 战斗机制扩展 & 伤害传导体系 & 行动条推拉 (v5.1 帧同步稳定版)
 * @author Secmon (Refactored by AI)
 * @version 5.1
 *
 * @param ---Default Animations---
 * @text [默认动画设置]
 * @default
 *
 * @param DefAnimHit
 * @parent ---Default Animations---
 * @text 默认打击动画ID
 * @type animation
 * @default 1
 *
 * @param DefAnimHeal
 * @parent ---Default Animations---
 * @text 默认治疗动画ID
 * @type animation
 * @default 46
 *
 * @param DefAnimBuff
 * @parent ---Default Animations---
 * @text 默认Buff动画ID
 * @type animation
 * @default 52
 *
 * @param ReactionHitDelay
 * @parent ---Default Animations---
 * @text 协战/识破打击延迟
 * @desc (快节奏) 技能动画播放多少帧后立即弹出伤害并进行下一回合？(推荐 12-20)
 * @type number
 * @default 12
 *
 * @param ---Time Settings---
 * @text [时间轴参数设置]
 * @default
 *
 * @param GuardianDelay
 * @parent ---Time Settings---
 * @text 守护光环间隔(ms)
 * @type number
 * @default 200
 *
 * @param ChargeDelay
 * @parent ---Time Settings---
 * @text 蓄力释放延迟(ms)
 * @type number
 * @default 400
 *
 * @param SynergyDelay
 * @parent ---Time Settings---
 * @text 队友协战延迟(ms)
 * @type number
 * @default 0
 *
 * @param StateInteractDelay
 * @parent ---Time Settings---
 * @text 状态交互延迟(ms)
 * @type number
 * @default 200
 *
 * @param FieldResonanceDelay
 * @parent ---Time Settings---
 * @text 力场共鸣延迟(ms)
 * @type number
 * @default 200
 *
 * @param RicochetBaseDelay
 * @parent ---Time Settings---
 * @text 闪电链初始间隔(ms)
 * @type number
 * @default 200
 *
 * @param RicochetDecay
 * @parent ---Time Settings---
 * @text 闪电链延迟递减(ms)
 * @type number
 * @default 30
 *
 * @param ---Visual Common---
 * @text [通用视觉设置]
 * @default
 *
 * @param PopupFontSize
 * @parent ---Visual Common---
 * @text 全局文字字号
 * @type number
 * @default 25
 *
 * @param ---Visual Synergy---
 * @text [表现-协战/识破]
 * @default
 * @param SynergyText
 * @parent ---Visual Synergy---
 * @text 协战文本
 * @default 协战
 * @param SynergyColor
 * @parent ---Visual Synergy---
 * @text 协战颜色
 * @default #FFD700
 * @param ReactionText
 * @parent ---Visual Synergy---
 * @text 识破文本
 * @default 识破
 * @param ReactionColor
 * @parent ---Visual Synergy---
 * @text 识破颜色
 * @default #FF4444
 * @param SynergyWait
 * @parent ---Visual Synergy---
 * @text 前摇帧数
 * @type number
 * @default 60
 * @param SynergySE
 * @parent ---Visual Synergy---
 * @text 音效文件名
 * @type file
 * @dir audio/se/
 * @default Skill2
 * @param SynergyVol
 * @parent ---Visual Synergy---
 * @text 音效音量
 * @default 90
 * @param SynergyPitch
 * @parent ---Visual Synergy---
 * @text 音效音调
 * @default 100
 *
 * @param ---Visual Splash---
 * @text [表现-溅射伤害]
 * @default
 * @param SplashText
 * @parent ---Visual Splash---
 * @text 文本内容
 * @default 溅射
 * @param SplashColor
 * @parent ---Visual Splash---
 * @text 文本颜色
 * @default #FF8800
 * @param SplashWait
 * @parent ---Visual Splash---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param SplashSE
 * @parent ---Visual Splash---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Evasion1
 *
 * @param ---Visual Ricochet---
 * @text [表现-弹射伤害]
 * @default
 * @param RicochetText
 * @parent ---Visual Ricochet---
 * @text 文本内容
 * @default 弹射
 * @param RicochetColor
 * @parent ---Visual Ricochet---
 * @text 文本颜色
 * @default #00FFFF
 * @param RicochetWait
 * @parent ---Visual Ricochet---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param RicochetSE
 * @parent ---Visual Ricochet---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Jump1
 *
 * @param ---Visual Field---
 * @text [表现-力场共鸣]
 * @default
 * @param FieldSpreadText
 * @parent ---Visual Field---
 * @text 扩散文本
 * @default 扩散
 * @param FieldGatherText
 * @parent ---Visual Field---
 * @text 聚焦文本
 * @default 聚焦
 * @param FieldColor
 * @parent ---Visual Field---
 * @text 文本颜色
 * @default #CC88FF
 * @param FieldWait
 * @parent ---Visual Field---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param FieldSE
 * @parent ---Visual Field---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Teleport
 *
 * @param ---Visual State---
 * @text [表现-状态交互]
 * @default
 * @param StateText
 * @parent ---Visual State---
 * @text 文本内容
 * @default 触发
 * @param StateColor
 * @parent ---Visual State---
 * @text 文本颜色
 * @default #88FF88
 * @param StateWait
 * @parent ---Visual State---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param StateSE
 * @parent ---Visual State---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Item3
 *
 * @param ---Visual StateCycle---
 * @text [表现-状态循环]
 * @default
 * @param StateCycleColor
 * @parent ---Visual StateCycle---
 * @text 文本颜色
 * @default #FF88FF
 * @param StateCycleWait
 * @parent ---Visual StateCycle---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param StateCycleSE
 * @parent ---Visual StateCycle---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Ice1
 *
 * @param ---Visual Exec---
 * @text [表现-斩杀]
 * @default
 * @param ExecText
 * @parent ---Visual Exec---
 * @text 文本内容
 * @default 斩杀
 * @param ExecColor
 * @parent ---Visual Exec---
 * @text 文本颜色
 * @default #FF0000
 * @param ExecWait
 * @parent ---Visual Exec---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param ExecSE
 * @parent ---Visual Exec---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Sword2
 *
 * @param ---Visual Drain---
 * @text [表现-吸血]
 * @default
 * @param DrainText
 * @parent ---Visual Drain---
 * @text 文本内容
 * @default 吸血
 * @param DrainColor
 * @parent ---Visual Drain---
 * @text 文本颜色
 * @default #FF88AA
 * @param DrainWait
 * @parent ---Visual Drain---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param DrainSE
 * @parent ---Visual Drain---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Heal1
 *
 * @param ---Visual DeathRattle---
 * @text [表现-亡语]
 * @default
 * @param DeathRattleText
 * @parent ---Visual DeathRattle---
 * @text 文本内容
 * @default 亡语
 * @param DeathRattleColor
 * @parent ---Visual DeathRattle---
 * @text 文本颜色
 * @default #BB00FF
 * @param DeathRattleWait
 * @parent ---Visual DeathRattle---
 * @text 停留帧数
 * @type number
 * @default 60
 * @param DeathRattleSE
 * @parent ---Visual DeathRattle---
 * @text 音效
 * @type file
 * @dir audio/se/
 * @default Darkness1
 *
 * @param ---Visual PushPull---
 * @text [表现-推条/拉条]
 * @default
 * @param PushText
 * @parent ---Visual PushPull---
 * @text 推条文本
 * @default 迟滞
 * @param PushColor
 * @parent ---Visual PushPull---
 * @text 推条颜色
 * @default #0088FF
 * @param PushWait
 * @parent ---Visual PushPull---
 * @text 推条停留帧数
 * @type number
 * @default 60
 * @param PushSE
 * @parent ---Visual PushPull---
 * @text 推条音效
 * @type file
 * @dir audio/se/
 * @default Wind7
 * @param PullText
 * @parent ---Visual PushPull---
 * @text 拉条文本
 * @default 神速
 * @param PullColor
 * @parent ---Visual PushPull---
 * @text 拉条颜色
 * @default #00FF88
 * @param PullWait
 * @parent ---Visual PushPull---
 * @text 拉条停留帧数
 * @type number
 * @default 60
 * @param PullSE
 * @parent ---Visual PushPull---
 * @text 拉条音效
 * @type file
 * @dir audio/se/
 * @default Wind7
 *
 * @help
 * ============================================================================
 * ★ 插件功能手册 v5.1 (帧同步修复版) ★
 * ============================================================================
 * 【优化说明 v5.1】
 * 1. [核心重构] 移除了所有 setTimeout，改用 BattleManager 帧计时器。
 * - 修复了游戏暂停、切屏或战斗结束时，伤害数字仍会弹出或报错的问题。
 * - 所有的延迟现在都严格基于游戏帧率 (60FPS)。
 * 2. [兼容性] 参数设置中的 ms 毫秒数会自动转换为帧数，无需修改现有参数。
 * 3. [修复] 修正了守护光环中 target.parent 的错误检查。
 *
 * ============================================================================
 */

(() => {
    'use strict';

    // ======================================================================
    // 0. 参数读取 & 配置整合
    // ======================================================================
    const pluginName = "Sec_BattleSystemInstance";
    const parameters = PluginManager.parameters(pluginName);
    
    // 毫秒转帧数的辅助函数 (假设60FPS, 16.66ms/frame)
    // 保证至少为1帧
    const msToFrames = (ms) => Math.max(1, Math.floor(ms / 16.666));

    const Sec_Params = {
        // [安全优化] 自动将参数里的毫秒转为帧数
        guardianDelay: msToFrames(Number(parameters['GuardianDelay'] || 200)),
        chargeDelay: msToFrames(Number(parameters['ChargeDelay'] || 400)),
        synergyDelay: msToFrames(Number(parameters['SynergyDelay'] || 0)), 
        stateInteractDelay: msToFrames(Number(parameters['StateInteractDelay'] || 200)),
        fieldDelay: msToFrames(Number(parameters['FieldResonanceDelay'] || 200)),
        ricochetBase: msToFrames(Number(parameters['RicochetBaseDelay'] || 200)),
        ricochetDecay: msToFrames(Number(parameters['RicochetDecay'] || 30)),
        
        hitDelay: Number(parameters['ReactionHitDelay'] || 12), // 快节奏延迟 (本身就是帧数)

        // 全局设置
        fontSize: Number(parameters['PopupFontSize'] || 25),

        // 视觉配置集 (无变动)
        visual: {
            synergy: { text: String(parameters['SynergyText'] || "协战"), color: String(parameters['SynergyColor'] || "#FFD700"), wait: Number(parameters['SynergyWait'] || 60), se: { name: parameters['SynergySE'], volume: Number(parameters['SynergyVol']), pitch: Number(parameters['SynergyPitch']) }, style: 'impact' },
            reaction: { text: String(parameters['ReactionText'] || "识破"), color: String(parameters['ReactionColor'] || "#FF0000"), wait: Number(parameters['SynergyWait'] || 60), se: { name: parameters['SynergySE'], volume: Number(parameters['SynergyVol']), pitch: Number(parameters['SynergyPitch']) }, style: 'impact' },
            splash: { text: String(parameters['SplashText'] || "溅射"), color: String(parameters['SplashColor'] || "#FF8800"), wait: Number(parameters['SplashWait'] || 60), se: parameters['SplashSE'], style: 'shake' },
            ricochet: { text: String(parameters['RicochetText'] || "弹射"), color: String(parameters['RicochetColor'] || "#00FFFF"), wait: Number(parameters['RicochetWait'] || 60), se: parameters['RicochetSE'], style: 'jump' },
            fieldSpread: { text: String(parameters['FieldSpreadText'] || "扩散"), color: String(parameters['FieldColor'] || "#CC88FF"), wait: Number(parameters['FieldWait'] || 60), se: parameters['FieldSE'], style: 'expand' },
            fieldGather: { text: String(parameters['FieldGatherText'] || "聚焦"), color: String(parameters['FieldColor'] || "#CC88FF"), wait: Number(parameters['FieldWait'] || 60), se: parameters['FieldSE'], style: 'contract' },
            state: { text: String(parameters['StateText'] || "触发"), color: String(parameters['StateColor'] || "#88FF88"), wait: Number(parameters['StateWait'] || 60), se: parameters['StateSE'], style: 'pulse' },
            stateCycle: { text: "", color: String(parameters['StateCycleColor'] || "#FF88FF"), wait: Number(parameters['StateCycleWait'] || 60), se: parameters['StateCycleSE'], style: 'rise' },
            exec: { text: String(parameters['ExecText'] || "斩杀"), color: String(parameters['ExecColor'] || "#FF0000"), wait: Number(parameters['ExecWait'] || 60), se: parameters['ExecSE'], style: 'slash' },
            drain: { text: String(parameters['DrainText'] || "吸血"), color: String(parameters['DrainColor'] || "#FF88AA"), wait: Number(parameters['DrainWait'] || 60), se: parameters['DrainSE'], style: 'float' },
            deathRattle: { text: String(parameters['DeathRattleText'] || "亡语"), color: String(parameters['DeathRattleColor'] || "#BB00FF"), wait: Number(parameters['DeathRattleWait'] || 60), se: parameters['DeathRattleSE'], style: 'pulse' },
            push: { text: String(parameters['PushText'] || "迟滞"), color: String(parameters['PushColor'] || "#0088FF"), wait: Number(parameters['PushWait'] || 60), se: parameters['PushSE'], style: 'shake' },
            pull: { text: String(parameters['PullText'] || "神速"), color: String(parameters['PullColor'] || "#00FF88"), wait: Number(parameters['PullWait'] || 60), se: parameters['PullSE'], style: 'jump' }
        }
    };

    const DEF_ANIM = {
        HIT: Number(parameters['DefAnimHit'] || 1),
        HEAL: Number(parameters['DefAnimHeal'] || 46),
        BUFF: Number(parameters['DefAnimBuff'] || 52),
        GUARD: Number(parameters['DefAnimBuff'] || 52)
    };

    // ======================================================================
    // 1. 辅助函数 & 核心计时器系统
    // ======================================================================
    
    // [核心优化] 新增：BattleManager 帧计时器系统
    const _BattleManager_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        _BattleManager_initMembers.call(this);
        this._secTimers = [];
    };

    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);
        this.updateSecTimers();
    };

    BattleManager.updateSecTimers = function() {
        if (!this._secTimers) return;
        for (let i = this._secTimers.length - 1; i >= 0; i--) {
            const timer = this._secTimers[i];
            timer.frames--;
            if (timer.frames <= 0) {
                // 安全执行回调
                if (typeof timer.callback === 'function') {
                    try {
                        timer.callback();
                    } catch (e) {
                        console.error("Sec_Timer Error:", e);
                    }
                }
                this._secTimers.splice(i, 1);
            }
        }
    };

    // [核心优化] 替代 setTimeout 的方法，单位为帧
    BattleManager.addSecTimer = function(frames, callback) {
        this._secTimers = this._secTimers || [];
        this._secTimers.push({ frames: frames, callback: callback });
    };

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

    function _Sec_HexToRgb(hex) {
        if (!hex) return [255, 255, 255];
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    function _Sec_PlaySE(seConfig) {
        if (typeof seConfig === 'string' && seConfig) {
             AudioManager.playSe({ name: seConfig, volume: 90, pitch: 100, pan: 0 });
        } else if (seConfig && seConfig.name) {
             AudioManager.playSe(seConfig);
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
    // 2. 核心逻辑挂钩：Game_Action.prototype.executeDamage (Fix v5.0)
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        
        const wasDead = target.isDead();

        _Game_Action_executeDamage.call(this, target, value);

        const subject = this.subject();
        const item = this.item();
        const actualDamage = target.result().hpDamage; 
        const params = Sec_Params.visual;

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
                    } catch (e) {}
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
                                // [优化] 使用帧计时器替代 setTimeout
                                BattleManager.addSecTimer(Sec_Params.chargeDelay, () => {
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
                                });
                            }
                            subject._secStoredDmg = 0;
                            subject.removeState(stateId);
                        } catch(e) {}
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
                    } catch (e) {}
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

            // B3. 守护光环 (修复+优化)
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

                                // [优化] 使用帧计时器嵌套
                                BattleManager.addSecTimer(Sec_Params.guardianDelay, () => {
                                    // [修复] 检查 target 是否依然有效，而不是检查 .parent
                                    if (target) { 
                                        _Sec_SuppressLog(target); 
                                        target.gainHp(transferAmount);
                                        // result 对象可能在回合切换时被重置，需检查
                                        if (target.result()) {
                                            target.result().hpDamage = -transferAmount;
                                            target.result().hpAffected = true;
                                        }
                                        target.startDamagePopup();
                                        target.performDamage(); 
                                        _Sec_PlayAnim(target, animId); 
                                    }
                                    
                                    BattleManager.addSecTimer(Sec_Params.guardianDelay, () => {
                                        if (guardian && guardian.isAlive()) {
                                            _Sec_SuppressLog(guardian); 
                                            guardian.gainHp(-guardianDmg);
                                            
                                            if (guardian.result()) {
                                                guardian.result().hpDamage = guardianDmg;
                                                guardian.result().hpAffected = true;
                                            }
                                            
                                            // 手动累加伤害记录 (用于裁决技能)
                                            if (guardianDmg > 0) {
                                                guardian._secSinAccumulator = (guardian._secSinAccumulator || 0) + guardianDmg;
                                            }

                                            guardian.startDamagePopup();
                                            guardian.performDamage();
                                            if (guardian.isDead()) guardian.performCollapse();
                                        }
                                    });
                                });
                            }
                            break; 
                        }
                    }
                }
            }
            
        }

        // A3. 亡语 (添加视觉特效)
        if (target && !wasDead && target.isDead()) {
             const noteData = _Sec_GetBattlerNotes(target);
             if (noteData) {
                const matches = noteData.matchAll(/<战斗触发[:：]\s*Dead\s*[,，]\s*([^>]+)>/gi);
                // 确保只触发一次视觉特效
                let visualTriggered = false;
                for (const match of matches) {
                    if (!visualTriggered) {
                        target.startCustomPopupConfig(params.deathRattle);
                        visualTriggered = true;
                    }
                    try {
                        const formula = match[1].trim();
                        const a = target, b = subject, v = $gameVariables._data, dmg = actualDamage;
                        _Sec_SuppressLog(a); _Sec_SuppressLog(b);
                        eval(formula);
                        if (b && b.isAlive !== undefined && b.result().hpAffected) {
                            b.startDamagePopup();
                            b.performDamage();
                            if (b.isDead()) b.performCollapse();
                        }
                    } catch (e) {}
                }
             }
        }

        if (!item) return;

        // ------------------------------------------------------------------
        // 【模块 C】 技能特效
        // ------------------------------------------------------------------
        const note = item.note;
        
        // --- C1. 状态交互 [FIXED] ---
        const stateInteractMatches = note.matchAll(/<状态交互[:：]\s*(\d+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^,，]+)\s*[,，]\s*([^>]+)\s*>/g);
        for (const match of stateInteractMatches) {
            const stateId = parseInt(match[1]);
            const formula = match[2].trim();
            const removeState = match[3].trim().toLowerCase() === 'true';
            const rawRange = match[4];
            
            const rangeLower = rawRange.split(/[,，]/)[0].trim().toLowerCase();
            let defaultAnim = DEF_ANIM.HIT;
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
                    // [Visual]
                    t.startCustomPopupConfig(params.state);
                    // [优化] 帧计时器
                    BattleManager.addSecTimer(Sec_Params.stateInteractDelay, () => {
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
                                
                                if (t.isDead()) t.performCollapse();
                            }
                            if (removeState) t.removeState(stateId);
                        } catch (e) {}
                    });
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
                affectedMembers.forEach(m => m.startCustomPopupConfig(params.fieldSpread));
                // [优化] 帧计时器
                BattleManager.addSecTimer(Sec_Params.fieldDelay, () => {
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
                });
            } else if (mode === 'gather') {
                if (affectedMembers.length > 0) target.startCustomPopupConfig(params.fieldGather);
                // [优化] 帧计时器
                BattleManager.addSecTimer(Sec_Params.fieldDelay, () => {
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
                });
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
            
            neighbors.forEach(n => {
                n.startCustomPopupConfig(params.splash); // Visual
                let splashDmg = 0;
                const damage = actualDamage; 
                
                if (!isNaN(param1) && !/[ab]\.|v\[/.test(param1) && parseFloat(param1) <= 5.0) {
                    splashDmg = Math.floor(damage * parseFloat(param1));
                } else {
                    try {
                        const a = subject, b = n, origin = target, d = damage, v = $gameVariables._data;
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
                e.friendsUnit() === target.friendsUnit() && e.isAlive()
            );

            let bouncePool = mode === 'random' ? allEnemies : allEnemies.sort((a, b) => a.index() - b.index());
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
                const currentInterval = Math.max(3, Sec_Params.ricochetBase - (index * Sec_Params.ricochetDecay)); // 修正为帧数
                accumulatedDelay += currentInterval;

                // [优化] 帧计时器
                BattleManager.addSecTimer(accumulatedDelay, () => {
                    if (enemy.isDead() && !allowRepeat) return;
                    enemy.startCustomPopupConfig(params.ricochet); // Visual

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
                        }
                    } catch (e) { console.error("[Sec] 弹射公式错误", e); }
                });
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
                target.startCustomPopupConfig(params.exec); // Visual
                try {
                    const a = subject, b = target, v = $gameVariables._data;
                    const dmg = actualDamage; 
                    const damage = actualDamage; 
                    const bonusDmg = Math.floor(eval(formula));
                    if (bonusDmg > 0) {
                        // [优化] 帧计时器 (100ms -> 6帧)
                        BattleManager.addSecTimer(6, () => {
                            _Sec_SuppressLog(target); target.gainHp(-bonusDmg); 
                            target.result().hpDamage = bonusDmg;
                            target.result().hpAffected = true;
                            target.startDamagePopup();
                            target.performDamage();
                            _Sec_PlayAnim(target, animId);
                            if (target.isDead()) target.performCollapse();
                        });
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
                subject.startCustomPopupConfig(params.drain); // Visual
                _Sec_SuppressLog(subject); subject.gainHp(healAmount); 
                subject.result().hpDamage = -healAmount; 
                subject.result().hpAffected = true;
                subject.startDamagePopup();
                _Sec_PlayAnim(subject, animId);
            }
        }
        
        // --- C6. 状态循环 (Stacking Logic) ---
        const stateCycleMatch = note.match(/<状态循环[:：]\s*([^>]+)\s*>/);
        if (stateCycleMatch) {
            const stateIds = stateCycleMatch[1].split(/[,，]/).map(id => parseInt(id.trim()));
            if (stateIds.length >= 2) {
                let currentIndex = stateIds.findIndex(id => target.isStateAffected(id));
                let addedStateId = 0;

                if (currentIndex === -1) {
                    addedStateId = stateIds[0];
                    target.addState(addedStateId);
                } else if (currentIndex < stateIds.length - 1) {
                    target.removeState(stateIds[currentIndex]);
                    addedStateId = stateIds[currentIndex + 1];
                    target.addState(addedStateId);
                }
                // (Reached max stack, do nothing as intended)

                if (addedStateId > 0) {
                    const stateData = $dataStates[addedStateId];
                    if (stateData) {
                        const baseConfig = Sec_Params.visual.stateCycle;
                        const dynamicConfig = {
                            text: stateData.name, 
                            color: baseConfig.color,
                            wait: baseConfig.wait,
                            se: baseConfig.se,
                            style: baseConfig.style
                        };
                        target.startCustomPopupConfig(dynamicConfig);
                    }
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
                target.startCustomPopupConfig(Sec_Params.visual.push); // Visual
            }

            // 拉条
            const pullMatch = note.match(/<拉条[:：]\s*(\d+)(?:[,，]\s*(\d+))?\s*>/);
            if (pullMatch) {
                const ticks = parseInt(pullMatch[1]);
                const animId = pullMatch[2] ? parseInt(pullMatch[2]) : 0;
                BattleManager.applyTpbTickShift(target, -ticks);
                _Sec_PlayAnim(target, animId);
                target.startCustomPopupConfig(Sec_Params.visual.pull); // Visual
            }
        }
    };

    // ======================================================================
    // 4. 【核心重构】反应队列系统
    // ======================================================================
    BattleManager._secReactionQueue = [];
    BattleManager.processSecReactionQueue = function() {
        if (this._secReactionQueue.length === 0) return;
        const reaction = this._secReactionQueue.shift();
        const observer = reaction.observer;
        if (observer.isAlive() && observer.canMove()) {
            observer.forceAction(reaction.skillId, reaction.targetIndex);
            const actions = observer._actions;
            if (actions && actions.length > 0) {
                const reactAction = actions[actions.length - 1]; 
                reactAction._isSecReaction = true;
                reactAction._secReactionType = reaction.type; 
            }
            this.forceAction(observer);
        } else {
            this.processSecReactionQueue();
        }
    };

    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        const triggerSubject = this._subject;
        const triggerAction = this._action;
        _BattleManager_endAction.call(this);
        if (triggerAction && triggerAction._isSecReaction) {
            if (this._secReactionQueue.length > 0) {
                this.processSecReactionQueue(); 
            }
            return; 
        }
        if (triggerSubject && triggerAction) {
            this._secReactionQueue = []; 
            this.broadcastActionSignal(triggerSubject, triggerAction);
            if (this._secReactionQueue.length > 0) {
                this.processSecReactionQueue();
            }
        }
    };

    BattleManager.broadcastActionSignal = function(source, action) {
        const allMembers = $gameParty.members().concat($gameTroop.members());
        allMembers.forEach(b => {
            b._ignoreMpLog = false;
            b._ignoreDamageLog = false;
        });
        for (const observer of allMembers) {
            if (!observer.isAlive() || !observer.canMove() || observer === source) continue;
            if (observer.friendsUnit() === source.friendsUnit()) {
                this.checkSynergy(observer, source, action);
            }
            if (observer.friendsUnit() !== source.friendsUnit()) {
                this.checkReaction(observer, source, action);
            }
        }
    };

    BattleManager.checkSynergy = function(observer, source, action) {
        const note = _Sec_GetBattlerNotes(observer);
        const matches = note.matchAll(/<队友协战[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any') {
                matchType = true;
            } else if (type === 'attack') {
                if (action.isForOpponent() && !action.isGuard()) matchType = true;
            } else if (type === 'support') {
                if ((action.isForFriend() || action.isRecover()) && !action.isGuard()) matchType = true;
            }

            if (matchType && Math.random() * 100 < chance) {
                let targetIndex = -2;
                if (action.isForOne() && this._targets.length > 0) targetIndex = this._targets[0].index();
                else if (action.isForOpponent()) {
                    const randomTarget = source.opponentsUnit().randomTarget();
                    if (randomTarget) targetIndex = randomTarget.index();
                }
                this._secReactionQueue.push({
                    observer: observer,
                    skillId: skillId,
                    targetIndex: targetIndex,
                    type: 'synergy' 
                });
            }
        }
    };

    BattleManager.checkReaction = function(observer, source, action) {
        const note = _Sec_GetBattlerNotes(observer);
        const matches = note.matchAll(/<敌方识破[:：]\s*([^,，]+)\s*[,，]\s*(\d+)\s*[,，]\s*(\d+)\s*>/g);
        for (const match of matches) {
            const type = match[1].trim().toLowerCase();
            const chance = parseInt(match[2]);
            const skillId = parseInt(match[3]);
            
            let matchType = false;
            if (type === 'any') {
                matchType = true;
            } else if (type === 'attack') {
                if (action.isForOpponent() && !action.isGuard()) matchType = true;
            } else if (type === 'support') {
                if ((action.isForFriend() || action.isRecover()) && !action.isGuard()) matchType = true;
            }

            if (matchType && Math.random() * 100 < chance) {
                const reactionSkill = $dataSkills[skillId];
                let targetIndex = -1;
                if (reactionSkill) {
                    if ([1, 2, 3, 4, 5, 6].includes(reactionSkill.scope)) targetIndex = source.index();
                    else targetIndex = observer.index();
                }
                this._secReactionQueue.push({
                    observer: observer,
                    skillId: skillId,
                    targetIndex: targetIndex,
                    type: 'reaction' 
                });
            }
        }
    };

    // ======================================================================
    // 5. 【视觉特效扩展】协战/识破 弹出文字 & 闪烁
    // ======================================================================

    // 5.1 Game_Battler: 请求弹出文字 & 闪烁
    Game_Battler.prototype.startCustomPopup = function(text, color, fontSize, duration, style) {
        this._customPopupText = text;
        this._customPopupColor = color;
        this._customPopupFontSize = fontSize;
        this._customPopupDuration = duration;
        this._customPopupStyle = style || 'impact';
        this.startDamagePopup();
    };

    // 快捷调用配置对象
    Game_Battler.prototype.startCustomPopupConfig = function(config) {
        if (!config) return;
        _Sec_PlaySE(config.se);
        this.startCustomPopup(
            config.text, 
            config.color, 
            Sec_Params.fontSize, 
            config.wait, 
            config.style
        );
    };

    // 请求闪烁
    Game_Battler.prototype.requestSecFlash = function(color, duration) {
        this._secFlashData = { color: color, duration: duration };
    };
    Game_Battler.prototype.isSecFlashRequested = function() {
        return !!this._secFlashData;
    };
    Game_Battler.prototype.secFlashData = function() {
        return this._secFlashData;
    };
    Game_Battler.prototype.clearSecFlash = function() {
        this._secFlashData = null;
    };

    // 5.2 Sprite_Damage: 拦截并显示自定义文字
    const _Sprite_Damage_setup = Sprite_Damage.prototype.setup;
    Sprite_Damage.prototype.setup = function(target) {
        if (target._customPopupText) {
            this.createCustomText(
                target._customPopupText, 
                target._customPopupColor, 
                target._customPopupFontSize, 
                target._customPopupDuration,
                target._customPopupStyle
            );
            target._customPopupText = null; 
            target._customPopupColor = null;
            target._customPopupFontSize = null;
            target._customPopupDuration = null;
            target._customPopupStyle = null;

            const result = target.result();
            if (result.hpAffected || result.mpDamage !== 0) {
                target._secKeepResult = true;
            }

            target.clearDamagePopup();
        } else {
            _Sprite_Damage_setup.call(this, target);
        }
    };

    Sprite_Damage.prototype.createCustomText = function(text, color, fontSize, duration, style) {
        const popupDuration = duration || 30; // 前摇
        const holdDuration = 10;              // 停留
        const fadeDuration = 20;              // 消失
        
        this._duration = popupDuration + holdDuration + fadeDuration;
        this._popupPhaseDur = popupDuration;
        this._holdPhaseDur = holdDuration;
        this._animStyle = style || 'impact';
        
        const h = fontSize || this.fontSize(); 
        const w = Math.floor(h * text.length * 1.5); 
        const sprite = this.createChildSprite(w, h);
        
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 1;
        
        // style init
        if (this._animStyle === 'impact') {
            sprite.scale.x = 0.5; sprite.scale.y = 0.5;
        } else if (this._animStyle === 'expand') {
            sprite.scale.x = 0.1; sprite.scale.y = 0.1;
        } else if (this._animStyle === 'contract') {
            sprite.scale.x = 2.0; sprite.scale.y = 2.0;
            this.opacity = 0;
        } else if (this._animStyle === 'slash') {
            sprite.scale.x = 0.2; sprite.scale.y = 2.0;
        } else if (this._animStyle === 'rise') { 
            sprite.scale.x = 0.5; sprite.scale.y = 0.5;
        } else if (this._animStyle === 'pulse') {
            sprite.scale.x = 1.0; sprite.scale.y = 1.0;
        }
        
        sprite.bitmap.fontSize = h;
        if (color) sprite.bitmap.textColor = color;
        
        sprite.bitmap.drawText(text, 0, 0, w, h, "center");
        sprite.dy = 0; 
        
        this.update = this.updateCustomPopup.bind(this, sprite);
    };

    Sprite_Damage.prototype.updateCustomPopup = function(childSprite) {
        const totalDuration = this._popupPhaseDur + this._holdPhaseDur + 20;
        const elapsed = totalDuration - this._duration;
        const t = Math.min(1, elapsed / this._popupPhaseDur);
        
        const easeOut = 1 - Math.pow(1 - t, 3);

        // 动画逻辑
        switch (this._animStyle) {
            case 'impact': // 极速放大
                if (elapsed < this._popupPhaseDur) {
                    const s = 0.5 + (0.8 * easeOut);
                    childSprite.scale.x = s; childSprite.scale.y = s;
                } else if (elapsed < this._popupPhaseDur + this._holdPhaseDur) {
                    childSprite.scale.x = 1.3; childSprite.scale.y = 1.3;
                }
                childSprite.y -= 0.2;
                break;

            case 'shake': // 震动
                if (elapsed < this._popupPhaseDur) {
                    childSprite.x = Math.sin(elapsed * 2) * 4;
                    childSprite.scale.x = 1.2; childSprite.scale.y = 1.2;
                } else {
                    childSprite.x = 0;
                }
                childSprite.y -= 0.5;
                break;
            
            case 'jump': // 跳跃
                if (elapsed < this._popupPhaseDur) {
                    childSprite.y = -Math.sin(t * Math.PI) * 20;
                }
                break;
            
            case 'expand': // 扩散
                if (elapsed < this._popupPhaseDur) {
                    const s = 1.2 * easeOut;
                    childSprite.scale.x = s; childSprite.scale.y = s;
                }
                break;

            case 'contract': // 聚焦
                if (elapsed < this._popupPhaseDur) {
                    const s = 2.0 - (1.0 * easeOut);
                    childSprite.scale.x = s; childSprite.scale.y = s;
                    this.opacity = Math.min(255, t * 255 * 2);
                }
                break;
            
            case 'pulse': // 脉动
                const pulse = 1.0 + Math.sin(elapsed * 0.3) * 0.1;
                childSprite.scale.x = pulse; childSprite.scale.y = pulse;
                childSprite.y -= 0.5;
                break;
            
            case 'slash': // 斩杀 (纵向)
                if (elapsed < this._popupPhaseDur) {
                    childSprite.scale.x = 0.2 + 0.8 * easeOut;
                    childSprite.scale.y = 2.0 - 1.0 * easeOut;
                }
                childSprite.y -= 0.2;
                break;

            case 'float': // 上浮
                childSprite.y -= 1.0;
                break;

            case 'rise': // 上升 (状态升级)
                childSprite.y -= 1.0; 
                if (elapsed < this._popupPhaseDur) {
                    const s = 0.5 + (0.7 * easeOut); // 0.5 -> 1.2
                    childSprite.scale.x = s; childSprite.scale.y = s;
                } else {
                    childSprite.scale.x = 1.2; childSprite.scale.y = 1.2;
                }
                break;
        }

        if (elapsed >= this._popupPhaseDur + this._holdPhaseDur) {
             this.opacity -= 15;
        }

        this._duration--;
    };

    // 5.3 Sprite_Battler: 角色闪烁逻辑 (动态时长)
    Sprite_Battler.prototype.setupDamagePopup = function() {
        if (this._battler.isDamagePopupRequested()) {
            if (this._battler.isSpriteVisible()) {
                this.createDamageSprite();
            }
            
            if (this._battler._secKeepResult) {
                this._battler._secKeepResult = false;
                this._battler.startDamagePopup(); 
            } else {
                this._battler.clearDamagePopup();
                this._battler.clearResult();
            }
        }
    };

    const _Sprite_Battler_update = Sprite_Battler.prototype.update;
    Sprite_Battler.prototype.update = function() {
        _Sprite_Battler_update.call(this);
        if (this._battler) this.updateSecVisualFlash();
    };

    Sprite_Battler.prototype.updateSecVisualFlash = function() {
        if (this._battler.isSecFlashRequested()) {
            const data = this._battler.secFlashData();
            this._secFlashDuration = data.duration;
            this._secFlashMaxDuration = data.duration;
            this._secFlashColor = data.color || [255, 255, 255];
            this._battler.clearSecFlash();
        }

        if (this._secFlashDuration > 0) {
            const d = this._secFlashDuration--;
            const alpha = Math.floor((d / this._secFlashMaxDuration) * 200); 
            this.setBlendColor([...this._secFlashColor, alpha]);
        }
    };

    // 5.4 Window_BattleLog
    const _Window_BattleLog_startAction = Window_BattleLog.prototype.startAction;
    Window_BattleLog.prototype.startAction = function(subject, action, targets) {
        if (action._isSecReaction) {
            this.push('performSynergyPopup', subject, action._secReactionType); 
            this.push('waitForSecPopup', action._secReactionType); 
        }
        _Window_BattleLog_startAction.call(this, subject, action, targets);
    };

    Window_BattleLog.prototype.waitForSecPopup = function(type) {
        let wait = 30;
        if (type === 'synergy') wait = Sec_Params.visual.synergy.wait;
        else if (type === 'reaction') wait = Sec_Params.visual.reaction.wait;
        
        this._waitCount = wait + 10;
    };
    
    // [New v4.7] Overwrite waitForAnimation for SecReaction
    const _Window_BattleLog_waitForAnimation = Window_BattleLog.prototype.waitForAnimation;
    Window_BattleLog.prototype.waitForAnimation = function() {
        if (this._action && this._action._isSecReaction) {
            this.wait(Sec_Params.hitDelay);
        } else {
            _Window_BattleLog_waitForAnimation.call(this);
        }
    };

    Window_BattleLog.prototype.performSynergyPopup = function(subject, reactionType) {
        let config = Sec_Params.visual.synergy;
        if (reactionType === 'reaction') config = Sec_Params.visual.reaction;

        subject.startCustomPopupConfig(config);
        
        const rgb = _Sec_HexToRgb(config.color);
        subject.requestSecFlash(rgb, config.wait); 
    };

    // ----------------------------------------------------------------------
    // 6. [Fix v4.5] 修复协战导致TPB回合丢失的问题
    // ----------------------------------------------------------------------
    const _BattleManager_endBattlerActions = BattleManager.endBattlerActions;
    BattleManager.endBattlerActions = function(battler) {
        if (this._action && this._action._isSecReaction) {
            battler.setActionState("undecided");

            if (battler.isTpbReady()) { 
                if (!this._actionBattlers.includes(battler)) {
                    this._actionBattlers.push(battler);
                    this._actionBattlers.sort((a, b) => b.tpbSpeed() - a.tpbSpeed());
                }
            }
            return; 
        }
        
        _BattleManager_endBattlerActions.call(this, battler);
    };
    
    const _Spriteset_Battle_isBusy = Spriteset_Battle.prototype.isBusy;
    Spriteset_Battle.prototype.isBusy = function() {
        if (BattleManager._secReactionQueue && BattleManager._secReactionQueue.length > 0) {
            return false;
        }
        return _Spriteset_Battle_isBusy.call(this);
    };

})();