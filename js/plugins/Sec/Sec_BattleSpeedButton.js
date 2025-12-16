/*:
 * @target MZ
 * @plugindesc [战斗] 独立战斗倍速按钮 (支持3倍速 & 显隐联动)
 * @author Secmon (Modified by AI)
 * @version 1.5
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
 * @param ---Colors---
 * @text [颜色设置]
 * @default
 *
 * @param ArrowColor
 * @parent ---Colors---
 * @text 1x 箭头颜色
 * @desc 普通状态的颜色 (Hex 格式)。
 * @type string
 * @default #ffffff
 *
 * @param ActiveColor
 * @parent ---Colors---
 * @text 2x 箭头颜色
 * @desc 2倍速时的颜色 (Hex 格式)。
 * @type string
 * @default #FFD700
 *
 * @param TurboColor
 * @parent ---Colors---
 * @text 3x 箭头颜色
 * @desc 3倍速(极速)时的颜色 (Hex 格式)。
 * @type string
 * @default #FF4500
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
 * @default 战斗速度
 *
 * @param OptionText1x
 * @parent ---Option Settings---
 * @text 1倍速文本
 * @type string
 * @default 1x (正常)
 *
 * @param OptionText2x
 * @parent ---Option Settings---
 * @text 2倍速文本
 * @type string
 * @default 2x (加速)
 *
 * @param OptionText3x
 * @parent ---Option Settings---
 * @text 3倍速文本
 * @type string
 * @default 3x (极速)
 *
 * @help
 * ============================================================================
 * Sec_BattleSpeedButton.js (v1.5)
 * ============================================================================
 *
 * 【三档变速机制】
 * 点击按钮将在以下模式间循环：
 * 1. 1x (正常): 默认游戏速度。
 * 2. 2x (加速): 调用系统自带的 FastForward（等同于按住 Shift）。
 * - 效果：文本显示加快，等待时间缩短 (步进值 3)。
 * 3. 3x (极速): 在 2x 基础上进一步消除等待。
 * - 效果：战斗日志的等待时间被强制归零，实现超快节奏。
 *
 * 【显隐控制】
 * 使用插件指令 [设置按钮可见性] 可在战斗中动态隐藏按钮。
 * 当按钮被隐藏时，速度会强制锁定为 1x。
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
        c1: parameters['ArrowColor'] || "#ffffff",
        c2: parameters['ActiveColor'] || "#FFD700",
        c3: parameters['TurboColor'] || "#FF4500", // 3倍速颜色
        optTitle: parameters['OptionText'] || "战斗速度",
        optTxt1: parameters['OptionText1x'] || "1x",
        optTxt2: parameters['OptionText2x'] || "2x",
        optTxt3: parameters['OptionText3x'] || "3x"
    };

    // ======================================================================
    // 1. ConfigManager 扩展 (改为存储数字 0,1,2)
    // ======================================================================
    
    // 0: 1x, 1: 2x, 2: 3x
    ConfigManager.secBattleSpeedMode = 0;

    const _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _ConfigManager_makeData.call(this);
        config.secBattleSpeedMode = this.secBattleSpeedMode;
        return config;
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        // 兼容旧版布尔值存档 (true -> 1, false -> 0)
        const oldVal = config.secBattleSpeedDefault;
        if (oldVal !== undefined) {
            this.secBattleSpeedMode = oldVal ? 1 : 0;
            delete config.secBattleSpeedDefault;
        } else {
            this.secBattleSpeedMode = Number(config.secBattleSpeedMode || 0);
        }
    };

    // ======================================================================
    // 2. Window_Options 扩展
    // ======================================================================
    
    const _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        this.addCommand(Conf.optTitle, "secBattleSpeedMode");
    };

    const _Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (symbol === "secBattleSpeedMode") {
            const value = this.getConfigValue(symbol);
            if (value === 2) return Conf.optTxt3;
            if (value === 1) return Conf.optTxt2;
            return Conf.optTxt1;
        }
        return _Window_Options_statusText.call(this, index);
    };

    // 重写 processOk 来支持三态切换
    const _Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === "secBattleSpeedMode") {
            let value = this.getConfigValue(symbol);
            value = (value + 1) % 3; // 0->1->2->0
            this.changeValue(symbol, value);
        } else {
            _Window_Options_processOk.call(this);
        }
    };

    // 支持左右键切换
    const _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function(wrap) {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === "secBattleSpeedMode") {
            let value = this.getConfigValue(symbol);
            value = (value + 1) % 3;
            this.changeValue(symbol, value);
        } else {
            _Window_Options_cursorRight.call(this, wrap);
        }
    };

    const _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function(wrap) {
        const index = this.index();
        const symbol = this.commandSymbol(index);
        if (symbol === "secBattleSpeedMode") {
            let value = this.getConfigValue(symbol);
            value = (value + 2) % 3; // 逆向循环
            this.changeValue(symbol, value);
        } else {
            _Window_Options_cursorLeft.call(this, wrap);
        }
    };

    // ======================================================================
    // 3. Game_System 扩展：状态管理
    // ======================================================================
    
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._secBattleSpeedMode = 0; // 0, 1, 2
        this._secSpeedButtonVisible = true;
    };

    const _Game_System_onBattleStart = Game_System.prototype.onBattleStart;
    Game_System.prototype.onBattleStart = function() {
        _Game_System_onBattleStart.call(this);
        this._secBattleSpeedMode = ConfigManager.secBattleSpeedMode;
    };

    // 获取当前实际生效的速度模式
    // 返回: 0(1x), 1(2x), 2(3x)
    Game_System.prototype.getSecBattleSpeedMode = function() {
        // 隐藏时强制 1x
        if (!this.isSecSpeedButtonVisible()) {
            return 0;
        }
        return this._secBattleSpeedMode;
    };

    // 循环切换
    Game_System.prototype.cycleSecBattleSpeed = function() {
        this._secBattleSpeedMode = (this._secBattleSpeedMode + 1) % 3;
        // 同步回 Config 以便记忆
        ConfigManager.secBattleSpeedMode = this._secBattleSpeedMode;
        ConfigManager.save();
        return this._secBattleSpeedMode;
    };

    Game_System.prototype.isSecSpeedButtonVisible = function() {
        return this._secSpeedButtonVisible;
    };

    Game_System.prototype.setSecSpeedButtonVisible = function(visible) {
        this._secSpeedButtonVisible = visible;
    };

    // ======================================================================
    // 4. 插件指令
    // ======================================================================
    PluginManager.registerCommand(pluginName, "SetButtonVisible", args => {
        const visible = args.visible === "true";
        $gameSystem.setSecSpeedButtonVisible(visible);
    });

    // ======================================================================
    // 5. 核心挂钩：速度实现
    // ======================================================================
    
    // A. 通用加速判定 (影响 2x 和 3x)
    const _Scene_Battle_isFastForward = Scene_Battle.prototype.isFastForward;
    Scene_Battle.prototype.isFastForward = function() {
        return _Scene_Battle_isFastForward.call(this) || $gameSystem.getSecBattleSpeedMode() >= 1;
    };

    const _Window_Message_isFastForward = Window_Message.prototype.isFastForward;
    Window_Message.prototype.isFastForward = function() {
        return _Window_Message_isFastForward.call(this) || $gameSystem.getSecBattleSpeedMode() >= 1;
    };

    // B. 战斗日志加速 (核心差异)
    const _Window_BattleLog_isFastForward = Window_BattleLog.prototype.isFastForward;
    Window_BattleLog.prototype.isFastForward = function() {
        // 只要模式 >= 1，就启用系统的基础加速(步进3)
        return _Window_BattleLog_isFastForward.call(this) || $gameSystem.getSecBattleSpeedMode() >= 1;
    };

    // C. 3倍速特供：强制消除等待
    const _Window_BattleLog_updateWaitCount = Window_BattleLog.prototype.updateWaitCount;
    Window_BattleLog.prototype.updateWaitCount = function() {
        // 如果是 3x 模式 (Mode 2)
        if ($gameSystem.getSecBattleSpeedMode() === 2) {
            if (this._waitCount > 0) {
                this._waitCount = 0; // 瞬发，消除所有 Log 等待
                return true;
            }
            return false;
        }
        // 1x 和 2x 使用系统默认逻辑 (2x 会由 isFastForward 处理成步进 3)
        return _Window_BattleLog_updateWaitCount.call(this);
    };

    // ======================================================================
    // 6. 按钮 Sprite 类 (绘制 1/2/3 个箭头)
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
            
            // 实时检查状态变化
            if (this._lastSpeedMode !== $gameSystem.getSecBattleSpeedMode()) {
                this.refresh();
            }
        }

        onClick() {
            $gameSystem.cycleSecBattleSpeed();
            SoundManager.playCursor();
            this.refresh();
        }

        refresh() {
            if (!this._windowskin.isReady()) return;

            const mode = $gameSystem.getSecBattleSpeedMode();
            this._lastSpeedMode = mode; 

            const w = this._size;
            const h = this._size;
            const ctx = this.bitmap.context;
            
            // 颜色选择
            let arrowColor = Conf.c1;
            if (mode === 1) arrowColor = Conf.c2;
            if (mode === 2) arrowColor = Conf.c3;

            this.bitmap.clear();

            // --- 绘制边框 (保持原样) ---
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

            // --- 绘制箭头 (动态计算 1/2/3 个) ---
            ctx.save();
            ctx.fillStyle = arrowColor;
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 3;

            const centerY = h / 2;
            const centerX = w / 2;
            
            // 箭头高度
            const iconH = h * 0.4; 
            // 单个箭头宽度
            const arrowW = iconH * 0.55; 
            // 箭头间隙 (3倍速时更紧凑)
            const gap = mode === 2 ? arrowW * 0.15 : arrowW * 0.25; 
            
            // 计算总宽度
            // Mode 0 (1个): 1*W
            // Mode 1 (2个): 2*W + 1*G
            // Mode 2 (3个): 3*W + 2*G
            const numArrows = mode + 1;
            const totalW = numArrows * arrowW + (numArrows - 1) * gap;
            
            let currentX = centerX - (totalW / 2);

            const drawTri = (ox) => {
                ctx.beginPath();
                ctx.moveTo(ox, centerY - iconH / 2);
                ctx.lineTo(ox + arrowW, centerY);
                ctx.lineTo(ox, centerY + iconH / 2);
                ctx.lineTo(ox + arrowW * 0.3, centerY); // 尾部内凹一点
                ctx.closePath();
                ctx.fill();
            };
            
            // 整体略微缩放以适应按钮
            ctx.translate(centerX, centerY);
            ctx.scale(0.85, 1); 
            ctx.translate(-centerX, -centerY);

            for (let i = 0; i < numArrows; i++) {
                drawTri(currentX);
                currentX += arrowW + gap;
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