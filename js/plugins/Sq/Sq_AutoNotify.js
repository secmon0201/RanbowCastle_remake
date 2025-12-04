/*:
 * @target MZ
 * @plugindesc [v2.4] J2ME风格通知窗口 (自动监听+手动指令+双向音效)
 * @author RpgmakerMz插件开发大师
 *
 * @help
 * ============================================================================
 * ✦ J2ME Notification Ultimate (v2.4 Sound Control) ✦
 * ============================================================================
 * 这是一个集成了“自动化监听”与“手动自定义”功能的完全体插件。
 * 风格复刻自J2ME老手机游戏（居中、紧凑、系统原生样式）。
 *
 * [v2.4 更新]
 * 1. 新增 [关闭音效] 控制。
 * 2. 分离了开启和关闭的音效开关。
 *
 * ----------------------------------------------------------------------------
 * ❖ 音效逻辑
 * ----------------------------------------------------------------------------
 * - 开启音效：窗口弹出时播放（模拟获得物品）。
 * - 关闭音效：窗口消失时播放（无论是倒计时结束，还是玩家手动按键跳过）。
 * * 注意：手动按键关闭时，现在会播放你设置的[关闭音效]，而不是系统的[确定音]，
 * 这样你可以自由定义交互听感（比如设为 Cancel 或 Cursor 音效）。
 *
 * ----------------------------------------------------------------------------
 * ❖ 功能 1: 自动监听 (Auto Listener)
 * ----------------------------------------------------------------------------
 * 插件会自动识别以下事件命令并弹窗：
 * 1. [增减金币] -> 自动显示 "\G 获得/失去 金币"
 * 2. [增减物品/武器/防具] -> 自动显示 "图标 获得/失去 物品 x数量"
 * 3. [队伍管理] -> 自动显示 "角色 加入/离开 队伍"
 *
 * ----------------------------------------------------------------------------
 * ❖ 功能 2: 手动指令 (Manual Command)
 * ----------------------------------------------------------------------------
 * 使用插件指令 [显示通知] 可以弹出自定义内容的窗口。
 *
 * ============================================================================
 *
 * @param defaultDuration
 * @text 窗口停留时间
 * @type number
 * @min 1
 * @default 90
 * @desc 消息在屏幕上停留的帧数 (60帧 = 1秒)。
 *
 * @param fontSize
 * @text 字体大小
 * @type number
 * @default 24
 * @desc 推荐设大一点(22-26)以适应竖屏。
 *
 * @param --- Open Sound ---
 * @text 
 *
 * @param enableOpenSound
 * @text 启用[弹出]音效
 * @parent --- Open Sound ---
 * @type boolean
 * @default true
 *
 * @param openSound
 * @text [弹出]音效设置
 * @parent --- Open Sound ---
 * @type struct<AudioSE>
 * @default {"name":"Item3","volume":"90","pitch":"100","pan":"0"}
 * @desc 窗口出现时的声音。
 *
 * @param --- Close Sound ---
 * @text 
 *
 * @param enableCloseSound
 * @text 启用[关闭]音效
 * @parent --- Close Sound ---
 * @type boolean
 * @default true
 *
 * @param closeSound
 * @text [关闭]音效设置
 * @parent --- Close Sound ---
 * @type struct<AudioSE>
 * @default {"name":"Cancel1","volume":"90","pitch":"100","pan":"0"}
 * @desc 窗口消失时的声音（含手动关闭和自动消失）。
 *
 * @command show
 * @text 显示通知(自定义)
 * @desc 手动弹出一个自定义内容的窗口。
 *
 * @arg text
 * @text 内容文本
 * @type string
 * @default \I[4] 任务更新：前往神殿
 * @desc 支持所有控制字符 \C[n], \I[n], \{, \} 等。
 *
 * @arg waitForInput
 * @text 是否强行等待
 * @type boolean
 * @default false
 * @desc true: 必须按键才关闭且无倒计时; false: 有倒计时但可按键提前关闭。
 *
 * @command enable
 * @text 开启自动通知
 * @desc 恢复自动监听功能。
 *
 * @command disable
 * @text 关闭自动通知
 * @desc 暂时屏蔽自动监听（手动指令不受影响）。
 *
 */

/*~struct~AudioSE:
 * @param name
 * @text 文件名
 * @type file
 * @dir audio/se/
 * @default Item3
 *
 * @param volume
 * @text 音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param pitch
 * @text 音调
 * @type number
 * @min 50
 * @max 150
 * @default 100
 *
 * @param pan
 * @text 声相
 * @type number
 * @min -100
 * @max 100
 * @default 0
 */

(() => {
    const pluginName = "JSq_AutoNotify";
    const parameters = PluginManager.parameters(pluginName);
    const defaultDuration = Number(parameters['defaultDuration'] || 90);
    const customFontSize = Number(parameters['fontSize'] || 24);
    
    // --- 音效解析辅助函数 ---
    const parseAudioParam = (paramStr, defaultName) => {
        let se = { name: defaultName, volume: 90, pitch: 100, pan: 0 };
        if (paramStr) {
            try {
                const parsed = JSON.parse(paramStr);
                se = {
                    name: parsed.name || defaultName,
                    volume: Number(parsed.volume || 90),
                    pitch: Number(parsed.pitch || 100),
                    pan: Number(parsed.pan || 0)
                };
            } catch (e) { console.warn("J2ME Notification: Audio param parse error"); }
        }
        return se;
    };

    // 开启音效配置
    const enableOpenSound = parameters['enableOpenSound'] === "true";
    const openSe = parseAudioParam(parameters['openSound'], "Item3");

    // 关闭音效配置
    const enableCloseSound = parameters['enableCloseSound'] === "true";
    const closeSe = parseAudioParam(parameters['closeSound'], "Cancel1");

    let _isAutoNotificationEnabled = true;

    //-----------------------------------------------------------------------------
    // Plugin Commands
    //-----------------------------------------------------------------------------
    PluginManager.registerCommand(pluginName, "enable", () => {
        _isAutoNotificationEnabled = true;
    });

    PluginManager.registerCommand(pluginName, "disable", () => {
        _isAutoNotificationEnabled = false;
    });

    PluginManager.registerCommand(pluginName, "show", args => {
        const text = String(args.text || "");
        const wait = args.waitForInput === "true";
        $gameSystem.pushJ2MEMessage(text, wait);
    });

    //-----------------------------------------------------------------------------
    // Game_System
    //-----------------------------------------------------------------------------
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initJ2MEData();
    };

    Game_System.prototype.initJ2MEData = function() {
        if (!this._j2meMsgQueue) this._j2meMsgQueue = [];
        if (this._isJ2MEWindowActive === undefined) this._isJ2MEWindowActive = false;
    };

    Game_System.prototype.pushJ2MEMessage = function(text, waitInput = false) {
        this.initJ2MEData();
        if (text && text.length > 0) {
            this._j2meMsgQueue.push({ text: text, wait: waitInput });
        }
    };

    Game_System.prototype.popJ2MEMessage = function() {
        this.initJ2MEData();
        return this._j2meMsgQueue.shift();
    };

    Game_System.prototype.hasJ2MEMessage = function() {
        this.initJ2MEData();
        return this._j2meMsgQueue && this._j2meMsgQueue.length > 0;
    };

    Game_System.prototype.setJ2MEWindowActive = function(active) {
        this.initJ2MEData();
        this._isJ2MEWindowActive = active;
    };

    Game_System.prototype.isJ2MEWindowActive = function() {
        this.initJ2MEData();
        return this._isJ2MEWindowActive;
    };

    //-----------------------------------------------------------------------------
    // Game_Player (移动锁定)
    //-----------------------------------------------------------------------------
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if ($gameSystem.isJ2MEWindowActive()) return false;
        return _Game_Player_canMove.call(this);
    };

    //-----------------------------------------------------------------------------
    // Game_Interpreter (自动监听逻辑)
    //-----------------------------------------------------------------------------
    Game_Interpreter.prototype.calcOperand = function(type, constant, variableId) {
        return type === 0 ? constant : $gameVariables.value(variableId);
    };

    const _Game_Interpreter_command125 = Game_Interpreter.prototype.command125;
    Game_Interpreter.prototype.command125 = function(params) {
        const result = _Game_Interpreter_command125.call(this, params);
        if (!_isAutoNotificationEnabled) return result;

        const operation = params[0];
        const amount = this.calcOperand(params[1], params[2], params[2]);
        
        if (amount > 0) {
            const currency = TextManager.currencyUnit;
            const actionText = operation === 0 ? "获得" : "失去";
            const msg = `${actionText} \\C[14]${amount}\\C[0] ${currency}`;
            $gameSystem.pushJ2MEMessage(msg, false);
        }
        return result;
    };

    const _Game_Interpreter_command126 = Game_Interpreter.prototype.command126;
    Game_Interpreter.prototype.command126 = function(params) {
        const result = _Game_Interpreter_command126.call(this, params);
        if (!_isAutoNotificationEnabled) return result;

        const itemId = params[0];
        const item = $dataItems[itemId];
        const operation = params[1];
        const amount = this.calcOperand(params[2], params[3], params[3]);

        if (item && amount > 0) {
            const actionText = operation === 0 ? "获得" : "失去";
            const msg = `\\I[${item.iconIndex}] ${actionText} \\C[14]${item.name}\\C[0] x${amount}`;
            $gameSystem.pushJ2MEMessage(msg, false);
        }
        return result;
    };

    const _Game_Interpreter_command127 = Game_Interpreter.prototype.command127;
    Game_Interpreter.prototype.command127 = function(params) {
        const result = _Game_Interpreter_command127.call(this, params);
        if (!_isAutoNotificationEnabled) return result;

        const itemId = params[0];
        const item = $dataWeapons[itemId];
        const operation = params[1];
        const amount = this.calcOperand(params[2], params[3], params[3]);

        if (item && amount > 0) {
            const actionText = operation === 0 ? "获得" : "失去";
            const msg = `\\I[${item.iconIndex}] ${actionText} \\C[14]${item.name}\\C[0] x${amount}`;
            $gameSystem.pushJ2MEMessage(msg, false);
        }
        return result;
    };

    const _Game_Interpreter_command128 = Game_Interpreter.prototype.command128;
    Game_Interpreter.prototype.command128 = function(params) {
        const result = _Game_Interpreter_command128.call(this, params);
        if (!_isAutoNotificationEnabled) return result;

        const itemId = params[0];
        const item = $dataArmors[itemId];
        const operation = params[1];
        const amount = this.calcOperand(params[2], params[3], params[3]);

        if (item && amount > 0) {
            const actionText = operation === 0 ? "获得" : "失去";
            const msg = `\\I[${item.iconIndex}] ${actionText} \\C[14]${item.name}\\C[0] x${amount}`;
            $gameSystem.pushJ2MEMessage(msg, false);
        }
        return result;
    };

    const _Game_Interpreter_command129 = Game_Interpreter.prototype.command129;
    Game_Interpreter.prototype.command129 = function(params) {
        const actorId = params[0];
        const operation = params[1];
        const actor = $dataActors[actorId];
        const isInParty = $gameParty.members().some(a => a.actorId() === actorId);

        const result = _Game_Interpreter_command129.call(this, params);
        if (!_isAutoNotificationEnabled) return result;

        if (actor) {
            if (operation === 0 && !isInParty) {
                const msg = `\\C[6]${actor.name}\\C[0] 加入队伍`;
                $gameSystem.pushJ2MEMessage(msg, false);
            }
            else if (operation === 1 && isInParty) {
                const msg = `\\C[6]${actor.name}\\C[0] 离开队伍`;
                $gameSystem.pushJ2MEMessage(msg, false);
            }
        }
        return result;
    };

    //-----------------------------------------------------------------------------
    // Window_J2MENotification
    //-----------------------------------------------------------------------------
    class Window_J2MENotification extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this.openness = 0; 
            this._duration = 0;
            this._forceWait = false;
            this._text = "";
            this.visible = false; 
        }

        resetFontSettings() {
            super.resetFontSettings();
            if (customFontSize > 0) this.contents.fontSize = customFontSize;
        }

        update() {
            super.update();
            
            if (this.isOpen()) {
                const isTriggered = Input.isTriggered('ok') || Input.isTriggered('cancel') || TouchInput.isTriggered();
                
                if (this._forceWait) {
                    if (isTriggered) {
                        this.processClose();
                    }
                } else {
                    if (isTriggered) {
                        this.processClose();
                    } else if (this._duration > 0) {
                        this._duration--;
                    } else {
                        this.processClose(); // 时间到
                    }
                }
            } else if (this.isClosed()) {
                if ($gameSystem.hasJ2MEMessage()) {
                    const msg = $gameSystem.popJ2MEMessage();
                    this.startMessage(msg.text, msg.wait);
                } else {
                    if (this.visible) {
                        this.visible = false;
                        $gameSystem.setJ2MEWindowActive(false);
                    }
                }
            }
        }

        // 统一处理关闭和音效
        processClose() {
            if (enableCloseSound && closeSe.name) {
                AudioManager.playSe(closeSe);
            }
            this.close();
        }

        startMessage(text, forceWait) {
            this._text = text;
            this._forceWait = forceWait;
            this._duration = defaultDuration;
            
            $gameSystem.setJ2MEWindowActive(true);

            // 播放弹出音效
            if (enableOpenSound && openSe.name) {
                AudioManager.playSe(openSe);
            }

            this.visible = true;
            this.refresh(); 
            this.open();    
        }

        calculateRect() {
            const textState = this.createTextState(this._text, 0, 0, 0);
            const textWidth = this.textSizeEx(this._text).width;
            const textHeight = this.textSizeEx(this._text).height;

            const padding = this.padding * 2;
            const minW = 120;
            const maxW = Graphics.boxWidth - 40; 
            
            let w = textWidth + padding + 40; 
            w = w.clamp(minW, maxW);
            let h = textHeight + padding; 
            return { w, h };
        }

        refresh() {
            if (!this._text) return;
            const dim = this.calculateRect();
            this.width = dim.w;
            this.height = dim.h;
            this.x = (Graphics.boxWidth - this.width) / 2;
            this.y = (Graphics.boxHeight - this.height) / 2;
            this.createContents(); 
            const textRect = this.baseTextRect();
            this.drawTextExCentered(this._text, textRect.width);
        }
        
        drawTextExCentered(text, width) {
            this.resetFontSettings();
            const textState = this.createTextState(text, 0, 0, width);
            const contentWidth = this.textSizeEx(text).width;
            const offsetX = Math.max(0, (width - contentWidth) / 2);
            textState.x += offsetX;
            this.processAllText(textState);
        }
    }

    // Scene Registration
    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createJ2MENotificationWindow();
    };

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createJ2MENotificationWindow();
    };

    Scene_Base.prototype.createJ2MENotificationWindow = function() {
        const rect = new Rectangle(0, 0, 100, 100);
        this._j2meNotificationWindow = new Window_J2MENotification(rect);
        this.addWindow(this._j2meNotificationWindow);
    };

})();