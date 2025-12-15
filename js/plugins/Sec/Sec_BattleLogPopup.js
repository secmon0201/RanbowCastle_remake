/*:
 * @target MZ
 * @plugindesc [战斗] 战报记录弹窗 & 自动染色 (v1.5 全功能版)
 * @author AI Architect
 * @orderAfter Sec_BattleSpeedButton
 * @orderAfter Sec_BattleVisuals
 *
 * @help
 * ============================================================================
 * 这是一个独立的战报记录系统。
 * 点击按钮弹出一个可滑动的窗口显示历史战斗信息。
 *
 * 【自动染色说明】
 * 插件会接管系统的日志生成，并自动为名字、技能、状态、数字添加颜色代码。
 * 您可以在下方参数中修改具体的颜色 ID。
 * (颜色 ID 参考：0=白 2=红 3=绿 4=蓝 6=米黄 14=黄 23=紫)
 *
 * 【状态名染色】
 * 对于“状态附加/移除”的消息，插件会尝试在文本中搜索“状态名称”并染色。
 * 比如消息是 "%1 陷入了中毒！"，且状态名为"中毒"，则"中毒"会被染色。
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
 * @default 680
 *
 * @param ButtonY
 * @parent ---Button Settings---
 * @text 按钮 Y 坐标
 * @type number
 * @default 120
 *
 * @param ButtonSize
 * @parent ---Button Settings---
 * @text 按钮尺寸
 * @type number
 * @default 32
 *
 * @param ---Popup Settings---
 * @text [弹窗设置]
 * @default
 *
 * @param WindowWidth
 * @parent ---Popup Settings---
 * @text 弹窗宽度
 * @type number
 * @default 600
 *
 * @param WindowHeight
 * @parent ---Popup Settings---
 * @text 弹窗高度
 * @type number
 * @default 800
 *
 * @param PopupOffsetX
 * @parent ---Popup Settings---
 * @text 弹窗中心 X 偏移
 * @type number
 * @min -9999
 * @default 0
 *
 * @param PopupOffsetY
 * @parent ---Popup Settings---
 * @text 弹窗中心 Y 偏移
 * @type number
 * @min -9999
 * @default 0
 *
 * @param ---Content Settings---
 * @text [内容设置]
 * @default
 *
 * @param FontSize
 * @parent ---Content Settings---
 * @text 日志字体大小
 * @type number
 * @default 20
 *
 * @param MaxLogLines
 * @parent ---Content Settings---
 * @text 最大记录行数
 * @type number
 * @default 100
 *
 * @param ---Color Settings---
 * @text [自动染色设置]
 * @default
 *
 * @param ColorActor
 * @parent ---Color Settings---
 * @text 我方名字颜色
 * @type number
 * @default 4
 *
 * @param ColorEnemy
 * @parent ---Color Settings---
 * @text 敌方名字颜色
 * @type number
 * @default 2
 *
 * @param ColorSkill
 * @parent ---Color Settings---
 * @text 技能/道具颜色
 * @type number
 * @default 14
 *
 * @param ColorState
 * @parent ---Color Settings---
 * @text 状态名颜色
 * @type number
 * @default 6
 *
 * @param ColorNumber
 * @parent ---Color Settings---
 * @text 数值颜色
 * @desc 伤害、治疗等数字的颜色。
 * @type number
 * @default 2
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleLogPopup";
    const parameters = PluginManager.parameters(pluginName);
    
    const Conf = {
        btnX: Number(parameters['ButtonX'] || 680),
        btnY: Number(parameters['ButtonY'] || 120),
        btnSize: Number(parameters['ButtonSize'] || 32),
        winW: Number(parameters['WindowWidth'] || 600),
        winH: Number(parameters['WindowHeight'] || 800),
        offX: Number(parameters['PopupOffsetX'] || 0),
        offY: Number(parameters['PopupOffsetY'] || 0),
        fontSize: Number(parameters['FontSize'] || 20),
        maxLines: Number(parameters['MaxLogLines'] || 100),
        // 颜色配置
        cActor: Number(parameters['ColorActor'] || 4),
        cEnemy: Number(parameters['ColorEnemy'] || 2),
        cSkill: Number(parameters['ColorSkill'] || 14),
        cState: Number(parameters['ColorState'] || 6),
        cNum:   Number(parameters['ColorNumber'] || 2)
    };

    // ======================================================================
    // 1. 数据层
    // ======================================================================
    
    const _BattleManager_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        _BattleManager_initMembers.call(this);
        this._fullBattleLog = [];
    };

    BattleManager.addSecBattleLog = function(text) {
        if (!text) return;
        this._fullBattleLog.push(text);
        while (this._fullBattleLog.length > Conf.maxLines) {
            this._fullBattleLog.shift();
        }
    };

    const _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        _Window_BattleLog_addText.call(this, text);
        BattleManager.addSecBattleLog(text);
    };

    // ======================================================================
    // 2. 染色逻辑：核心重写
    // ======================================================================

    // 辅助：名字染色
    Window_BattleLog.prototype.secColorName = function(battler) {
        const name = battler.name();
        const color = battler.isActor() ? Conf.cActor : Conf.cEnemy;
        return `\\C[${color}]${name}\\C[0]`;
    };

    // 辅助：技能/道具染色
    Window_BattleLog.prototype.secColorItem = function(item) {
        return `\\C[${Conf.cSkill}]${item.name}\\C[0]`;
    };

    // 辅助：数值染色
    Window_BattleLog.prototype.secColorNum = function(num) {
        return `\\C[${Conf.cNum}]${Math.abs(num)}\\C[0]`;
    };

    // [重写] 释放技能/道具
    Window_BattleLog.prototype.displayItemMessage = function(fmt, subject, item) {
        if (fmt) {
            const name1 = this.secColorName(subject);
            const name2 = this.secColorItem(item);
            this.push("addText", fmt.format(name1, name2));
        }
    };

    // [重写] HP伤害文本
    Window_BattleLog.prototype.makeHpDamageText = function(target) {
        const result = target.result();
        const damage = result.hpDamage;
        const isActor = target.isActor();
        const targetName = this.secColorName(target);
        const damageText = this.secColorNum(damage); // 染色数字
        let fmt;
        if (damage > 0 && result.drain) {
            fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
            return fmt.format(targetName, TextManager.hp, damageText);
        } else if (damage > 0) {
            fmt = isActor ? TextManager.actorDamage : TextManager.enemyDamage;
            return fmt.format(targetName, damageText);
        } else if (damage < 0) {
            fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
            return fmt.format(targetName, TextManager.hp, damageText);
        } else {
            fmt = isActor ? TextManager.actorNoDamage : TextManager.enemyNoDamage;
            return fmt.format(targetName);
        }
    };

    // [重写] MP伤害文本
    Window_BattleLog.prototype.makeMpDamageText = function(target) {
        const result = target.result();
        const damage = result.mpDamage;
        const isActor = target.isActor();
        const targetName = this.secColorName(target);
        const damageText = this.secColorNum(damage);
        let fmt;
        if (damage > 0 && result.drain) {
            fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
            return fmt.format(targetName, TextManager.mp, damageText);
        } else if (damage > 0) {
            fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
            return fmt.format(targetName, TextManager.mp, damageText);
        } else if (damage < 0) {
            fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
            return fmt.format(targetName, TextManager.mp, damageText);
        } else {
            return "";
        }
    };

    // [重写] TP伤害文本
    Window_BattleLog.prototype.makeTpDamageText = function(target) {
        const result = target.result();
        const damage = result.tpDamage;
        const isActor = target.isActor();
        const targetName = this.secColorName(target);
        const damageText = this.secColorNum(damage);
        let fmt;
        if (damage > 0) {
            fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
            return fmt.format(targetName, TextManager.tp, damageText);
        } else if (damage < 0) {
            fmt = isActor ? TextManager.actorGain : TextManager.enemyGain;
            return fmt.format(targetName, TextManager.tp, damageText);
        } else {
            return "";
        }
    };

    // [重写] 状态添加
    Window_BattleLog.prototype.displayAddedStates = function(target) {
        const result = target.result();
        const states = result.addedStateObjects();
        const targetName = this.secColorName(target);
        for (const state of states) {
            const stateText = target.isActor() ? state.message1 : state.message2;
            if (state.id === target.deathStateId()) {
                this.push("performCollapse", target);
            }
            if (stateText) {
                this.push("popBaseLine");
                this.push("pushBaseLine");
                // 尝试智能替换状态名
                let text = stateText;
                if (state.name) {
                    const coloredState = `\\C[${Conf.cState}]${state.name}\\C[0]`;
                    text = text.replace(state.name, coloredState);
                }
                this.push("addText", text.format(targetName));
                this.push("waitForEffect");
            }
        }
    };

    // [重写] 状态移除
    Window_BattleLog.prototype.displayRemovedStates = function(target) {
        const result = target.result();
        const states = result.removedStateObjects();
        const targetName = this.secColorName(target);
        for (const state of states) {
            if (state.message4) {
                this.push("popBaseLine");
                this.push("pushBaseLine");
                let text = state.message4;
                if (state.name) {
                    const coloredState = `\\C[${Conf.cState}]${state.name}\\C[0]`;
                    text = text.replace(state.name, coloredState);
                }
                this.push("addText", text.format(targetName));
            }
        }
    };

    // [重写] 闪避/失败等
    Window_BattleLog.prototype.displayMiss = function(target) {
        let fmt;
        if (target.result().physical) {
            const isActor = target.isActor();
            fmt = isActor ? TextManager.actorNoHit : TextManager.enemyNoHit;
            this.push("performMiss", target);
        } else {
            fmt = TextManager.actionFailure;
        }
        this.push("addText", fmt.format(this.secColorName(target)));
    };

    Window_BattleLog.prototype.displayEvasion = function(target) {
        let fmt;
        if (target.result().physical) {
            fmt = TextManager.evasion;
            this.push("performEvasion", target);
        } else {
            fmt = TextManager.magicEvasion;
            this.push("performMagicEvasion", target);
        }
        this.push("addText", fmt.format(this.secColorName(target)));
    };

    Window_BattleLog.prototype.displayFailure = function(target) {
        if (target.result().isHit() && !target.result().success) {
            this.push("addText", TextManager.actionFailure.format(this.secColorName(target)));
        }
    };

    // ======================================================================
    // 3. 视图层：Window_BattleHistory (物理滚动修复版)
    // ======================================================================
    
    class Window_BattleHistory extends Window_Scrollable {
        initialize(rect) {
            super.initialize(rect);
            this._data = [];
            this.hide();
            this.setBackgroundType(0);
            this.backOpacity = 240;
        }

        // [核心修复] 物理滚动映射
        updateOrigin() {
            this.origin.y = this.scrollY();
        }

        lineHeight() {
            return Conf.fontSize + 8; 
        }

        resetFontSettings() {
            super.resetFontSettings();
            this.contents.fontSize = Conf.fontSize;
        }

        refresh() {
            this._data = (BattleManager._fullBattleLog || []).concat();
            
            const totalH = this.overallHeight();
            const h = Math.max(totalH, this.innerHeight);
            
            if (!this.contents || this.contents.height < h) {
                this.contents = new Bitmap(this.innerWidth, h);
            } else {
                this.contents.clear();
                if (this.contents.height > h + 500) {
                     this.contents.resize(this.innerWidth, h);
                }
            }

            this.resetFontSettings();
            
            let y = 0;
            const lh = this.lineHeight();
            
            for (const text of this._data) {
                this.drawTextEx(text, 0, y, this.innerWidth);
                y += lh;
            }
        }

        overallHeight() {
            return (this._data.length + 1) * this.lineHeight();
        }

        scrollToBottom() {
            if (this.overallHeight() > this.innerHeight) {
                this.scrollTo(0, this.overallHeight() - this.innerHeight);
            } else {
                this.scrollTo(0, 0);
            }
        }

        show() {
            this.refresh();
            super.show();
            this.scrollToBottom();
            this.activate();
        }
    }

    // ======================================================================
    // 4. 交互层：按钮
    // ======================================================================
    
    class Sprite_LogButton extends Sprite_Clickable {
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

        onClick() {
            SoundManager.playOk();
            SceneManager._scene.toggleHistoryWindow();
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

            this.bitmap.fontSize = Math.floor(h * 0.4); 
            this.bitmap.textColor = "#ffffff";
            this.bitmap.outlineColor = "rgba(0, 0, 0, 0.8)";
            this.bitmap.outlineWidth = 3;
            this.bitmap.drawText("LOG", 0, 0, w, h, "center");
        }
    }

    // ======================================================================
    // 5. 场景整合
    // ======================================================================

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createHistoryWindow();
        this.createLogButton();
    };

    Scene_Battle.prototype.createHistoryWindow = function() {
        const ww = Conf.winW;
        const wh = Conf.winH;
        const wx = (Graphics.boxWidth - ww) / 2 + Conf.offX;
        const wy = (Graphics.boxHeight - wh) / 2 + Conf.offY;
        const rect = new Rectangle(wx, wy, ww, wh);
        this._historyWindow = new Window_BattleHistory(rect);
        this._historyWindow.z = 100;
        this.addWindow(this._historyWindow);
    };

    Scene_Battle.prototype.createLogButton = function() {
        this._logButton = new Sprite_LogButton();
        this.addChild(this._logButton);
    };

    Scene_Battle.prototype.toggleHistoryWindow = function() {
        if (this._historyWindow.visible) {
            this._historyWindow.hide();
            this._logButton.opacity = 255;
        } else {
            this._historyWindow.show();
            this._logButton.opacity = 150;
        }
    };

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        if (this._historyWindow && this._historyWindow.visible) {
            if (TouchInput.isTriggered()) {
                const x = TouchInput.x;
                const y = TouchInput.y;
                const inWin = x >= this._historyWindow.x && 
                              x <= this._historyWindow.x + this._historyWindow.width &&
                              y >= this._historyWindow.y && 
                              y <= this._historyWindow.y + this._historyWindow.height;
                const inBtn = Math.abs(x - this._logButton.x) < (Conf.btnSize/2 + 20) && 
                              Math.abs(y - this._logButton.y) < (Conf.btnSize/2 + 20);

                if (!inWin && !inBtn) {
                    this._historyWindow.hide();
                    this._logButton.opacity = 255;
                    SoundManager.playCancel();
                }
            }
        }
    };

})();