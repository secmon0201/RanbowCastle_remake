/*:
 * @target MZ
 * @plugindesc [彩虹城堡重制版] 战斗核心综合插件 (日志阻塞+窗口锁定+UI重构+TPB修复)
 * @author 神枪手 (Master Architect)
 *
 * @help
 * ============================================================================
 * 🌈 Sq_RainbowBattleCore - 战斗核心综合插件 (v2.0)
 * ============================================================================
 * 这是一个专为 J2ME 彩虹城堡重制版（竖屏 480x854）定制的合集插件。
 * 融合了原 Sq_BattleWindow、Sq_BattleStatusWindowFixed、Sq_BattleUI 的功能。
 * * v2.0 更新：
 * -内置了 TPB (时间制) 模式下的输入冲突修复。
 *
 * 核心功能：
 * 1. 【暴力日志】：战斗日志显示时，强制阻塞游戏流程，隐藏指令窗口，直到日志播放完毕。
 * 2. 【窗口锁定】：强制锁定状态窗口位置，防止任何外力移动它。
 * 3. 【UI重构】：重写了战斗中各窗口（指令、帮助、敌人选择）的位置和尺寸计算逻辑。
 * 4. 【头像优化】：状态栏头像支持非正方形图片的等比例缩放绘制。
 * 5. 【TPB修复】：修复了时间制战斗下，回合切换时指令窗口与日志窗口打架的Bug。
 *
 * ============================================================================
 * 参数说明
 * ============================================================================
 * 为了方便调整，原 UI 插件中的“写死”坐标已全部变为参数。
 * 默认值已设置为您提供的代码中的数值。
 *
 * @param --- General ---
 * @text [基础资源]
 * @default
 *
 * @param battleWindowSkin
 * @parent --- General ---
 * @text 窗口皮肤文件名
 * @desc 战斗窗口（含日志）使用的皮肤文件名（需放在img/system/）。
 * @default Battlewindow
 * @type string
 *
 * @param --- Battle Log ---
 * @text [战斗日志设置]
 * @default
 *
 * @param logFontSize
 * @parent --- Battle Log ---
 * @text 日志字体大小
 * @default 20
 * @type number
 *
 * @param logHeight
 * @parent --- Battle Log ---
 * @text 日志窗口高度
 * @default 70
 * @type number
 *
 * @param logBottomOffset
 * @parent --- Battle Log ---
 * @text 底部距离修正
 * @desc 0为紧贴底部，正数向上移动。
 * @default 0
 * @type number
 *
 * @param logClearDelay
 * @parent --- Battle Log ---
 * @text 日志停留时间(帧)
 * @desc 文本显示后的强制等待时间（60帧=1秒）。
 * @default 60
 * @type number
 *
 * @param fadeInSpeed
 * @parent --- Battle Log ---
 * @text 淡入速度
 * @desc 1-255，数值越大越快。
 * @default 255
 * @type number
 *
 * @param fadeOutSpeed
 * @parent --- Battle Log ---
 * @text 淡出速度
 * @desc 1-255，数值越大越快。
 * @default 25
 * @type number
 *
 * @param --- Colors ---
 * @text [文本颜色ID]
 * @default
 *
 * @param actorNameColor
 * @parent --- Colors ---
 * @text 我方名字颜色
 * @default 4
 * @type number
 *
 * @param enemyNameColor
 * @parent --- Colors ---
 * @text 敌方名字颜色
 * @default 2
 * @type number
 *
 * @param skillNameColor
 * @parent --- Colors ---
 * @text 技能物品颜色
 * @default 14
 * @type number
 *
 * @param --- Status Window ---
 * @text [状态窗口锁定]
 * @default
 *
 * @param statusX
 * @parent --- Status Window ---
 * @text 状态栏 X坐标
 * @default 0
 * @type number
 *
 * @param statusY
 * @parent --- Status Window ---
 * @text 状态栏 Y坐标
 * @default 0
 * @type number
 *
 * @param statusWidth
 * @parent --- Status Window ---
 * @text 状态栏 宽度
 * @default 480
 * @type number
 *
 * @param statusHeight
 * @parent --- Status Window ---
 * @text 状态栏 高度
 * @default 200
 * @type number
 *
 * @param --- Command Windows ---
 * @text [指令窗口布局]
 * @default
 *
 * @param partyCmdWidth
 * @parent --- Command Windows ---
 * @text 队伍指令宽度
 * @default 130
 * @type number
 *
 * @param partyCmdHeight
 * @parent --- Command Windows ---
 * @text 队伍指令高度
 * @default 200
 * @type number
 * * @param actorCmdWidth
 * @parent --- Command Windows ---
 * @text 角色指令宽度
 * @default 130
 * @type number
 *
 * @param actorCmdHeight
 * @parent --- Command Windows ---
 * @text 角色指令高度
 * @default 200
 * @type number
 *
 * @param actorCmdX
 * @parent --- Command Windows ---
 * @text 角色指令X坐标
 * @desc 设置为 -1 则自动计算，否则强制使用此坐标。
 * @default 0
 * @type number
 *
 * @param actorCmdY
 * @parent --- Command Windows ---
 * @text 角色指令Y坐标
 * @default 70
 * @type number
 *
 * @param --- Other Windows ---
 * @text [其他窗口布局]
 * @default
 *
 * @param enemySelX
 * @parent --- Other Windows ---
 * @text 敌人选择窗口X
 * @default 190
 * @type number
 *
 * @param helpY
 * @parent --- Other Windows ---
 * @text 帮助窗口Y坐标
 * @default -5
 * @type number
 *
 * @param helpHeight
 * @parent --- Other Windows ---
 * @text 帮助窗口高度
 * @desc 自动计算行数请设为0，否则强制使用此高度。
 * @default 210
 * @type number
 *
 * @param --- Enemy Icons ---
 * @text [敌人图标]
 * @default
 *
 * @param enemyIconSize
 * @parent --- Enemy Icons ---
 * @text 图标大小
 * @default 24
 * @type number
 *
 * @param enemyIconSpace
 * @parent --- Enemy Icons ---
 * @text 图标间距
 * @default 2
 * @type number
 *
 * @param enemyIconMax
 * @parent --- Enemy Icons ---
 * @text 最大图标数
 * @default 8
 * @type number
 *
 * @param enemyIconOffsetY
 * @parent --- Enemy Icons ---
 * @text Y轴修正
 * @default 10
 * @type number
 */

(() => {
    const pluginName = "Sq_BattleUI";
    const parameters = PluginManager.parameters(pluginName);

    // --- 参数解析 ---
    const Params = {
        skin: String(parameters['battleWindowSkin'] || 'Battlewindow'),
        
        // Log
        logFontSize: Number(parameters['logFontSize'] || 20),
        logHeight: Number(parameters['logHeight'] || 70),
        logBottom: Number(parameters['logBottomOffset'] || 0),
        logDelay: Number(parameters['logClearDelay'] || 60),
        fadeIn: Number(parameters['fadeInSpeed'] || 255),
        fadeOut: Number(parameters['fadeOutSpeed'] || 25),
        
        // Color
        cActor: Number(parameters['actorNameColor'] || 4),
        cEnemy: Number(parameters['enemyNameColor'] || 2),
        cSkill: Number(parameters['skillNameColor'] || 14),
        
        // Status Fixed
        statusX: Number(parameters['statusX'] || 0),
        statusY: Number(parameters['statusY'] || 0),
        statusW: Number(parameters['statusWidth'] || 480),
        statusH: Number(parameters['statusHeight'] || 200),
        
        // Command Layout
        pCmdW: Number(parameters['partyCmdWidth'] || 130),
        pCmdH: Number(parameters['partyCmdHeight'] || 200),
        aCmdW: Number(parameters['actorCmdWidth'] || 130),
        aCmdH: Number(parameters['actorCmdHeight'] || 200),
        aCmdX: Number(parameters['actorCmdX'] || 0),
        aCmdY: Number(parameters['actorCmdY'] || 70),
        
        // Other Layout
        enemySelX: Number(parameters['enemySelX'] || 190),
        helpY: Number(parameters['helpY'] || -5),
        helpH: Number(parameters['helpHeight'] || 210),
        
        // Icons
        iconSize: Number(parameters['enemyIconSize'] || 24),
        iconSpace: Number(parameters['enemyIconSpace'] || 2),
        iconMax: Number(parameters['enemyIconMax'] || 8),
        iconOffsetY: Number(parameters['enemyIconOffsetY'] || 10)
    };

    // ========================================================================
    // 模块 1: 窗口皮肤统一加载 & 辅助函数
    // ========================================================================
    const _loadCustomSkin = function() {
        this.windowskin = ImageManager.loadSystem(Params.skin);
    };

    const WindowClasses = [
        Window_PartyCommand, Window_BattleStatus, Window_ActorCommand,
        Window_Help, Window_MenuCommand, Window_MenuActor, Window_BattleLog
    ];
    WindowClasses.forEach(klass => {
        klass.prototype.loadWindowskin = _loadCustomSkin;
    });

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    }

    function colorizeText(text) {
        if (!text) return text;
        const actors = $gameParty.battleMembers();
        for (const actor of actors) {
            const name = actor.name();
            if (text.includes(name)) {
                const reg = new RegExp(escapeRegExp(name), 'g');
                text = text.replace(reg, `\\C[${Params.cActor}]${name}\\C[0]`);
            }
        }
        const enemies = $gameTroop.members(); 
        for (const enemy of enemies) {
            const name = enemy.originalName();
            if (name && text.includes(name) && !text.includes(`]${name}`)) {
                const reg = new RegExp(escapeRegExp(name), 'g');
                text = text.replace(reg, `\\C[${Params.cEnemy}]${name}\\C[0]`);
            }
        }
        return text;
    }

    // ========================================================================
    // 模块 2: 自定义彩虹日志窗口 (Rainbow Log)
    // ========================================================================
    function Window_RainbowLog() {
        this.initialize(...arguments);
    }

    Window_RainbowLog.prototype = Object.create(Window_Base.prototype);
    Window_RainbowLog.prototype.constructor = Window_RainbowLog;

    Window_RainbowLog.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this.loadWindowskin();
        this.opacity = 0;         
        this.contentsOpacity = 0;
        this._lines = [];
        this._waitCount = 0;
        this._state = 'idle'; 
        this.visible = false;
    };

    Window_RainbowLog.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(Params.skin);
    };

    Window_RainbowLog.prototype.resetFontSettings = function() {
        Window_Base.prototype.resetFontSettings.call(this);
        this.contents.fontSize = Params.logFontSize;
    };

    Window_RainbowLog.prototype.isBlocking = function() {
        return this._state !== 'idle';
    };

    Window_RainbowLog.prototype.addLog = function(text) {
        this._lines = [text]; 
        this._waitCount = Params.logDelay; 
        this.refresh();
        this.show();
        this.open();
        this.opacity = 0; 
        this.contentsOpacity = 0;
        this._state = 'opening';
    };

    Window_RainbowLog.prototype.clearLog = function() {
        this._lines = [];
        this._waitCount = 0;
        this.opacity = 0;
        this.contentsOpacity = 0;
        this.contents.clear();
        this.visible = false;
        this._state = 'idle';
    };

    Window_RainbowLog.prototype.refresh = function() {
        this.contents.clear();
        if (this._lines.length > 0) {
            const text = this._lines[0];
            const width = this.innerWidth;
            const textSize = this.textSizeEx(text);
            const x = Math.max(0, (width - textSize.width) / 2);
            const y = (this.innerHeight - textSize.height) / 2;
            this.drawTextEx(text, x, y, width);
        }
    };

    Window_RainbowLog.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (this._lines.length === 0) return;

        switch (this._state) {
            case 'opening':
                this.visible = true;
                this.opacity = Math.min(this.opacity + Params.fadeIn, 255);
                this.contentsOpacity = Math.min(this.contentsOpacity + Params.fadeIn, 255);
                if (this.opacity >= 255) {
                    this._state = 'waiting';
                }
                break;
            case 'waiting':
                if (this._waitCount > 0) {
                    this._waitCount--;
                } else {
                    this._state = 'closing';
                }
                break;
            case 'closing':
                this.opacity -= Params.fadeOut;
                this.contentsOpacity -= Params.fadeOut;
                if (this.opacity <= 0) {
                    this.clearLog();
                }
                break;
        }
    };

    // ========================================================================
    // 模块 3: 战斗逻辑劫持 (阻塞与日志替换 & TPB修复)
    // ========================================================================
    
    // 劫持 isBusy，如果日志在显示，系统视为忙碌
    const _BattleManager_isBusy = BattleManager.isBusy;
    BattleManager.isBusy = function() {
        if (_BattleManager_isBusy.call(this)) return true;
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene._rainbowLogWindow) {
            if (scene._rainbowLogWindow.isBlocking()) return true; 
        }
        return false;
    };

    // 【新增修复】劫持 updateTpbInput：如果日志正忙，禁止 TPB 检测输入
    // 这是修复窗口打架的关键！
    const _BattleManager_updateTpbInput = BattleManager.updateTpbInput;
    BattleManager.updateTpbInput = function() {
        // 如果系统忙碌（包括正在播放彩虹日志），直接阻断 TPB 输入检测
        if (this.isBusy()) {
            return;
        }
        _BattleManager_updateTpbInput.call(this);
    };

    // 【新增修复】额外保险：防止 update 中途状态切换导致的窗口残留
    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);
        
        // 如果当前标记为正在输入，但突然变成忙碌状态，强制关闭输入标志
        if (this.isTpb() && this.isInputting() && this.isBusy()) {
            this._inputting = false;
        }
    };

    // 劫持指令窗口可见性：日志显示时强制隐藏指令
    const _Scene_Battle_updateInputWindowVisibility = Scene_Battle.prototype.updateInputWindowVisibility;
    Scene_Battle.prototype.updateInputWindowVisibility = function() {
        if (this._rainbowLogWindow && this._rainbowLogWindow.isBlocking()) {
            this.closeCommandWindows();
            this.hideSubInputWindows();
            return;
        }
        _Scene_Battle_updateInputWindowVisibility.call(this);
    };

    // 场景创建：挂载彩虹窗口，阉割原版日志
    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        
        // 移出原版日志
        if (this._logWindow) {
            this._logWindow.x = 20000;
            this._logWindow.visible = false;
        }
        this.createRainbowLogWindow();
    };

    Scene_Battle.prototype.createRainbowLogWindow = function() {
        const h = Params.logHeight; 
        const w = Graphics.boxWidth;
        const x = 0;
        const y = Graphics.boxHeight - h - Params.logBottom;
        const rect = new Rectangle(x, y, w, h);
        this._rainbowLogWindow = new Window_RainbowLog(rect);
        this.addChild(this._rainbowLogWindow);
    };

    // 原版日志功能剥离与数据转发
    Window_BattleLog.prototype.drawBackground = function() { };
    Window_BattleLog.prototype.drawLineText = function(index) { };
    Window_BattleLog.prototype.refresh = function() { };
    Window_BattleLog.prototype.updateVisibilityByContent = function() { this.visible = false; };

    const _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        _Window_BattleLog_addText.call(this, text); 
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene._rainbowLogWindow) {
            const coloredText = colorizeText(text);
            scene._rainbowLogWindow.addLog(coloredText);
        }
    };

    const _Window_BattleLog_displayItemMessage = Window_BattleLog.prototype.displayItemMessage;
    Window_BattleLog.prototype.displayItemMessage = function(fmt, subject, item) {
        if (fmt) {
            const coloredItemName = `\\C[${Params.cSkill}]${item.name}\\C[0]`;
            const text = fmt.format(subject.name(), coloredItemName);
            this.push('addText', text);
        } else {
            _Window_BattleLog_displayItemMessage.call(this, fmt, subject, item);
        }
    };

    const _Window_BattleLog_displayMpDamage = Window_BattleLog.prototype.displayMpDamage;
    Window_BattleLog.prototype.displayMpDamage = function(target) {
        if (target._ignoreMpLog) {
            target._ignoreMpLog = false;
            if (target.result().mpDamage < 0) return;
        }
        _Window_BattleLog_displayMpDamage.call(this, target);
    };

    // ========================================================================
    // 模块 4: 战斗窗口 UI 重构 (位置与尺寸)
    // ========================================================================

    // 1. 状态窗口 (Fixed Logic)
    Scene_Battle.prototype.statusWindowRect = function() {
        return new Rectangle(Params.statusX, Params.statusY, Params.statusW, Params.statusH);
    };

    // 强制固定位置（防干扰）
    const _Scene_Battle_createStatusWindow = Scene_Battle.prototype.createStatusWindow;
    Scene_Battle.prototype.createStatusWindow = function() {
        _Scene_Battle_createStatusWindow.call(this);
        if (this._statusWindow) {
            this._statusWindow.x = Params.statusX;
            this._statusWindow.y = Params.statusY;
            this._statusWindow._isFixedPosition = true;
        }
    };

    const _Scene_Battle_commandAttack = Scene_Battle.prototype.commandAttack;
    Scene_Battle.prototype.commandAttack = function() {
        _Scene_Battle_commandAttack.call(this);
        if (this._statusWindow) {
            this._statusWindow.visible = true;
            this._statusWindow.x = Params.statusX;
            this._statusWindow.y = Params.statusY;
        }
    };

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        if (this._statusWindow) {
            if (this._statusWindow.x !== Params.statusX) this._statusWindow.x = Params.statusX;
            if (this._statusWindow.y !== Params.statusY) this._statusWindow.y = Params.statusY;
        }
    };

    // 锁死移动方法
    const _Window_Base_setX = Window_Base.prototype.setX;
    Window_Base.prototype.setX = function(x) {
        if (!this._isFixedPosition) _Window_Base_setX.call(this, x);
    };
    const _Window_Base_setY = Window_Base.prototype.setY;
    Window_Base.prototype.setY = function(y) {
        if (!this._isFixedPosition) _Window_Base_setY.call(this, y);
    };

    // 2. 脸图优化 (Face Scaling)
    Window_BattleStatus.prototype.drawFace = function(faceName, faceIndex, x, y, width, height) {
        width = width || ImageManager.faceWidth;
        height = height || ImageManager.faceHeight;
        const bitmap = ImageManager.loadFace(faceName);
        const pw = ImageManager.faceWidth;
        const ph = ImageManager.faceHeight;
        const sw = pw;
        const sh = ph;
        const dx = x;
        const dy = y;
        
        // 等比例缩放计算
        const availableWidth = width || 120;
        const availableHeight = height || 120;
        const scaleX = availableWidth / pw;
        const scaleY = availableHeight / ph;
        const scale = Math.min(scaleX, scaleY, 1);
        const dw = pw * scale;
        const dh = ph * scale;
        const sx = (faceIndex % 4) * pw;
        const sy = Math.floor(faceIndex / 4) * ph;
        
        this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
    };

    // 3. 其他窗口 UI 定义
    // 消息窗口
    Scene_Message.prototype.messageWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(4, false) + 8;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 队伍指令
    Scene_Battle.prototype.partyCommandWindowRect = function() {
        const ww = Params.pCmdW;
        const wh = Params.pCmdH;
        const wx = 0;
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 角色指令
    Scene_Battle.prototype.actorCommandWindowRect = function() {
        const ww = Params.aCmdW;
        const wh = Params.aCmdH;
        const wx = Params.aCmdX;
        const wy = Params.aCmdY;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 敌人选择
    Scene_Battle.prototype.enemyWindowRect = function() {
        const wx = Params.enemySelX;
        const ww = Params.statusW; // 复用状态栏宽度
        const wh = this.windowAreaHeight();
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 帮助窗口
    Scene_Battle.prototype.helpWindowRect = function() {
        const wx = 0;
        const wy = Params.helpY;
        const ww = Graphics.boxWidth;
        // 如果设置为0，使用默认计算逻辑，否则使用参数
        const wh = Params.helpH > 0 ? Params.helpH : this.helpAreaHeight();
        return new Rectangle(wx, wy, ww, wh);
    };

    // 返回按钮移出屏幕(隐藏)
    Scene_Battle.prototype.createCancelButton = function() {
        this._cancelButton = new Sprite_Button("cancel");
        this._cancelButton.x = 10000;
        this._cancelButton.y = this.buttonY();
        this.addWindow(this._cancelButton);
    };

    // ========================================================================
    // 模块 5: 敌人状态图标优化
    // ========================================================================
    const _Sprite_StateIcon_initMembers = Sprite_StateIcon.prototype.initMembers;
    Sprite_StateIcon.prototype.initMembers = function() {
        _Sprite_StateIcon_initMembers.call(this);
        this._lastIconListString = ""; 
    };

    const _Sprite_StateIcon_update = Sprite_StateIcon.prototype.update;
    Sprite_StateIcon.prototype.update = function() {
        if (this._battler && this._battler.isEnemy()) {
            Sprite.prototype.update.call(this);
            this.updateEnemyIcons();
        } else {
            _Sprite_StateIcon_update.call(this);
        }
    };

    Sprite_StateIcon.prototype.updateEnemyIcons = function() {
        if (!this._battler) return;
        let icons = this._battler.allIcons();
        if (icons.length > Params.iconMax) icons = icons.slice(0, Params.iconMax);

        const currentIconString = JSON.stringify(icons);
        if (this._lastIconListString !== currentIconString) {
            this._lastIconListString = currentIconString;
            this.refreshEnemyIcons(icons);
        }
        this.y += Params.iconOffsetY;
    };

    Sprite_StateIcon.prototype.refreshEnemyIcons = function(icons) {
        if (this.bitmap) { this.bitmap.destroy(); this.bitmap = null; }
        if (icons.length === 0) return;

        const iconSet = ImageManager.loadSystem("IconSet");
        if (!iconSet.isReady()) { this._lastIconListString = ""; return; }

        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const targetSize = Params.iconSize;
        const spacing = Params.iconSpace;
        const totalWidth = icons.length * targetSize + (icons.length - 1) * spacing;
        const totalHeight = targetSize;

        this.bitmap = new Bitmap(totalWidth, totalHeight);
        for (let i = 0; i < icons.length; i++) {
            const iconIndex = icons[i];
            const sx = (iconIndex % 16) * pw;
            const sy = Math.floor(iconIndex / 16) * ph;
            const dx = i * (targetSize + spacing);
            this.bitmap.blt(iconSet, sx, sy, pw, ph, dx, 0, targetSize, targetSize);
        }
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    };

})();