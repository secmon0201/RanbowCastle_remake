/*:
 * @target MZ
 * @plugindesc [战斗] 独立战斗倍速按钮 (显隐联动版)
 * @author Secmon
 * @version 1.4
 *
 * @command SetButtonVisible
 * @text 设置按钮可见性
 * @desc 控制战斗界面中倍速按钮的显示或隐藏。隐藏时强制恢复1倍速。
 *
 * @arg visible
 * @text 是否显示
 * @desc true为显示，false为隐藏。
 * @type boolean
 * @default true
 *
 * @param ButtonX
 * @text 按钮 X 坐标
 * @desc 按钮在屏幕上的 X 坐标。
 * @type number
 * @min 0
 * @default 10
 *
 * @param ButtonY
 * @text 按钮 Y 坐标
 * @desc 按钮在屏幕上的 Y 坐标。
 * @type number
 * @min 0
 * @default 203
 *
 * @param ButtonSize
 * @text 按钮尺寸
 * @desc 按钮的宽高（正方形）。
 * @type number
 * @default 32
 *
 * @param ArrowColor
 * @text 箭头颜色
 * @desc 箭头的填充颜色 (Hex 格式)。
 * @type string
 * @default #ffffff
 *
 * @param ActiveColor
 * @text 激活态颜色
 * @desc 2倍速激活时的箭头颜色 (Hex 格式)。
 * @type string
 * @default #FFD700
 *
 * @param ---Option Settings---
 * @text [选项菜单设置]
 * @default
 *
 * @param OptionText
 * @parent ---Option Settings---
 * @text 选项名称
 * @desc 在“选项”菜单中显示的命令名称。
 * @type string
 * @default 默认战斗倍速
 *
 * @param OptionText1x
 * @parent ---Option Settings---
 * @text 1倍速显示文本
 * @desc 代表 1倍速 的状态文本 (原OFF)。
 * @type string
 * @default 1x
 *
 * @param OptionText2x
 * @parent ---Option Settings---
 * @text 2倍速显示文本
 * @desc 代表 2倍速 的状态文本 (原ON)。
 * @type string
 * @default 2x
 *
 * @help
 * ============================================================================
 * Sec_BattleSpeedButton.js
 * ============================================================================
 * 这是一个独立的战斗倍速控制插件。
 *
 * 【功能介绍】
 * 1. 界面按钮：
 * - 点击切换 1x / 2x 速度。
 * - 2x 速度等同于按住 Shift 键。
 *
 * 2. 选项菜单集成：
 * - 玩家可以在[选项]中设置“默认战斗倍速”。
 *
 * 3. 显隐控制 (v1.4 重要更新)：
 * - 使用插件指令 [设置按钮可见性] 可在战斗中动态隐藏按钮。
 * - 关键特性：当按钮被隐藏时，无论当前设置是1倍还是2倍，
 * 战斗都会**强制恢复为1倍速**。
 * - 只有按钮显示时，加速功能才生效。
 *
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleSpeedButton";
    const parameters = PluginManager.parameters(pluginName);

    const Conf = {
        x: Number(parameters['ButtonX'] || 10),
        y: Number(parameters['ButtonY'] || 203),
        size: Number(parameters['ButtonSize'] || 32),
        colorNormal: parameters['ArrowColor'] || "#ffffff",
        colorActive: parameters['ActiveColor'] || "#FFD700",
        optionText: parameters['OptionText'] || "默认战斗倍速",
        optionText1x: parameters['OptionText1x'] || "1x",
        optionText2x: parameters['OptionText2x'] || "2x"
    };

    // ======================================================================
    // 1. ConfigManager 扩展
    // ======================================================================
    
    ConfigManager.secBattleSpeedDefault = false;

    const _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _ConfigManager_makeData.call(this);
        config.secBattleSpeedDefault = this.secBattleSpeedDefault;
        return config;
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        this.secBattleSpeedDefault = this.readFlag(config, "secBattleSpeedDefault", false);
    };

    // ======================================================================
    // 2. Window_Options 扩展
    // ======================================================================
    
    const _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        this.addCommand(Conf.optionText, "secBattleSpeedDefault");
    };

    const _Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (symbol === "secBattleSpeedDefault") {
            const value = this.getConfigValue(symbol);
            return value ? Conf.optionText2x : Conf.optionText1x;
        }
        return _Window_Options_statusText.call(this, index);
    };

    // ======================================================================
    // 3. Game_System 扩展：状态管理
    // ======================================================================
    
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._secBattleSpeedUp = false;
        this._secSpeedButtonVisible = true; // 默认显示
    };

    const _Game_System_onBattleStart = Game_System.prototype.onBattleStart;
    Game_System.prototype.onBattleStart = function() {
        _Game_System_onBattleStart.call(this);
        this._secBattleSpeedUp = ConfigManager.secBattleSpeedDefault;
    };

    // [v1.4 修改] 获取加速状态：增加可见性判断
    Game_System.prototype.isSecBattleSpeedUp = function() {
        // 如果按钮被隐藏，强制返回 false (1倍速)
        if (!this.isSecSpeedButtonVisible()) {
            return false;
        }
        return this._secBattleSpeedUp;
    };

    // 切换状态 (仅改变内部标记，实际生效与否取决于 visible)
    Game_System.prototype.toggleSecBattleSpeedUp = function() {
        this._secBattleSpeedUp = !this._secBattleSpeedUp;
        return this._secBattleSpeedUp;
    };

    Game_System.prototype.isSecSpeedButtonVisible = function() {
        return this._secSpeedButtonVisible;
    };

    Game_System.prototype.setSecSpeedButtonVisible = function(visible) {
        this._secSpeedButtonVisible = visible;
    };

    // ======================================================================
    // 4. 插件指令注册
    // ======================================================================
    PluginManager.registerCommand(pluginName, "SetButtonVisible", args => {
        const visible = args.visible === "true";
        $gameSystem.setSecSpeedButtonVisible(visible);
    });

    // ======================================================================
    // 5. 核心挂钩
    // ======================================================================
    
    const _Scene_Battle_isFastForward = Scene_Battle.prototype.isFastForward;
    Scene_Battle.prototype.isFastForward = function() {
        return _Scene_Battle_isFastForward.call(this) || $gameSystem.isSecBattleSpeedUp();
    };

    const _Window_BattleLog_isFastForward = Window_BattleLog.prototype.isFastForward;
    Window_BattleLog.prototype.isFastForward = function() {
        return _Window_BattleLog_isFastForward.call(this) || $gameSystem.isSecBattleSpeedUp();
    };

    const _Window_Message_isFastForward = Window_Message.prototype.isFastForward;
    Window_Message.prototype.isFastForward = function() {
        return _Window_Message_isFastForward.call(this) || $gameSystem.isSecBattleSpeedUp();
    };

    // ======================================================================
    // 6. 按钮 Sprite 类
    // ======================================================================
    class Sprite_SecSpeedButton extends Sprite_Clickable {
        initialize() {
            super.initialize();
            this._windowskin = ImageManager.loadSystem("Window");
            this.x = Conf.x;
            this.y = Conf.y;
            this._size = Conf.size;
            this.bitmap = new Bitmap(this._size, this._size);
            this._windowskin.addLoadListener(this.refresh.bind(this));
            this.refresh();
        }

        update() {
            super.update();
            this.visible = $gameSystem.isSecSpeedButtonVisible();
            this.opacity = this.isPressed() ? 200 : 255;
            
            // 实时检查加速状态是否改变 (包括因 visible 改变导致的强制降速)
            if (this._lastSpeedState !== $gameSystem.isSecBattleSpeedUp()) {
                this.refresh();
            }
        }

        onClick() {
            $gameSystem.toggleSecBattleSpeedUp();
            SoundManager.playCursor();
            this.refresh();
        }

        refresh() {
            if (!this._windowskin.isReady()) return;

            // 获取当前实际生效的速度状态
            const isSpeedUp = $gameSystem.isSecBattleSpeedUp();
            this._lastSpeedState = isSpeedUp; 

            const w = this._size;
            const h = this._size;
            const ctx = this.bitmap.context;
            const arrowColor = isSpeedUp ? Conf.colorActive : Conf.colorNormal;

            this.bitmap.clear();

            // A. 绘制风格化边框
            const m = 24; 
            const drawM = Math.min(m, w / 2); 

            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(2, 2, w - 4, h - 4);

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

            // B. 绘制矢量箭头
            ctx.save();
            ctx.fillStyle = arrowColor;
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 3;

            const iconH = h * 0.4;
            const centerY = h / 2;
            const centerX = w / 2;

            if (isSpeedUp) {
                const arrowW = iconH * 0.7; 
                const gap = arrowW * 0.2;   
                const totalW = arrowW * 2 + gap; 
                const startX = centerX - (totalW / 2);

                const drawTri = (ox) => {
                    ctx.beginPath();
                    ctx.moveTo(ox, centerY - iconH / 2);
                    ctx.lineTo(ox + arrowW, centerY);
                    ctx.lineTo(ox, centerY + iconH / 2);
                    ctx.lineTo(ox + arrowW * 0.25, centerY);
                    ctx.closePath();
                    ctx.fill();
                };
                
                ctx.translate(centerX, centerY);
                ctx.scale(0.75, 1); 
                ctx.translate(-centerX, -centerY);

                drawTri(startX);
                drawTri(startX + arrowW + gap);
            } else {
                const arrowW = iconH * 0.8;
                const startX = centerX - (arrowW * 0.7 / 2);

                ctx.beginPath();
                ctx.moveTo(startX, centerY - iconH / 2);
                ctx.lineTo(startX + arrowW, centerY);
                ctx.lineTo(startX, centerY + iconH / 2);
                ctx.lineTo(startX + arrowW * 0.25, centerY);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ======================================================================
    // 7. 注入到战斗场景
    // ======================================================================
    const _Scene_Battle_createButtons = Scene_Battle.prototype.createButtons;
    Scene_Battle.prototype.createButtons = function() {
        _Scene_Battle_createButtons.call(this);
        this.createSecSpeedButton();
    };

    Scene_Battle.prototype.createSecSpeedButton = function() {
        this._secSpeedButton = new Sprite_SecSpeedButton();
        this.addWindow(this._secSpeedButton); 
    };

})();