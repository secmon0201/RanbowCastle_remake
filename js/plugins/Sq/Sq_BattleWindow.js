/*:
 * @target MZ
 * @plugindesc [战斗核心] 暴力阻塞式日志系统 & 窗口防重叠 (v3.0)
 * @author 神枪手 (Master Architect)
 *
 * @param --- General ---
 * @text [基础设置]
 * @default
 *
 * @param battleWindowSkin
 * @parent --- General ---
 * @text 窗口皮肤名称
 * @desc 战斗窗口（含日志）使用的皮肤文件名（需放在img/system/）。
 * @default Battlewindow
 * @type string
 *
 * @param --- Battle Log Layout ---
 * @text [日志外观布局]
 * @default
 *
 * @param logFontSize
 * @parent --- Battle Log Layout ---
 * @text 字体大小
 * @default 20
 * @type number
 *
 * @param logHeight
 * @parent --- Battle Log Layout ---
 * @text 窗口高度
 * @default 70
 * @type number
 *
 * @param logBottomOffset
 * @parent --- Battle Log Layout ---
 * @text 底部距离修正
 * @desc 0为紧贴底部，正数向上移动。
 * @default 0
 * @type number
 *
 * @param --- Battle Log Logic ---
 * @text [日志逻辑设置]
 * @default
 *
 * @param logClearDelay
 * @parent --- Battle Log Logic ---
 * @text 停留时间(帧)
 * @desc 文本显示后的强制等待时间（60帧=1秒）。
 * @default 60
 * @type number
 *
 * @param fadeInSpeed
 * @parent --- Battle Log Logic ---
 * @text 淡入速度
 * @desc 1-255，数值越大越快。
 * @default 255
 * @type number
 *
 * @param fadeOutSpeed
 * @parent --- Battle Log Logic ---
 * @text 淡出速度
 * @desc 1-255，数值越大越快。
 * @default 25
 * @type number
 *
 * @param --- Text Colors ---
 * @text [文本颜色]
 * @default
 *
 * @param actorNameColor
 * @parent --- Text Colors ---
 * @text 我方名字颜色ID
 * @default 4
 * @type number
 *
 * @param enemyNameColor
 * @parent --- Text Colors ---
 * @text 敌方名字颜色ID
 * @default 2
 * @type number
 *
 * @param skillNameColor
 * @parent --- Text Colors ---
 * @text 技能物品颜色ID
 * @default 14
 * @type number
 *
 * @param --- Enemy Icons ---
 * @text [敌人状态图标]
 * @default
 *
 * @param enemyIconSize
 * @parent --- Enemy Icons ---
 * @text 图标显示大小
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
 * @text 最大图标显示数
 * @default 8
 * @type number
 *
 * @param enemyIconOffsetY
 * @parent --- Enemy Icons ---
 * @text Y轴位置修正
 * @default 10
 * @type number
 *
 * @help
 * ============================================================================
 * 核心修复说明 (v3.0 暴力版)
 * ============================================================================
 * 针对指令窗口和日志窗口“打架”的问题，本版本采用了最底层的拦截方式：
 *
 * 1. 【场景级压制】：
 * 直接劫持了 Scene_Battle 的 updateInputWindowVisibility 方法。
 * 只要日志窗口在屏幕上（不透明度 > 0），它就会强制执行 
 * closeCommandWindows()，让左侧指令窗口物理消失。
 *
 * 2. 【忙碌锁死】：
 * 只要日志在显示，BattleManager.isBusy() 强制返回 true。
 * 这会暂停战斗流程的推进。
 *
 * 3. 【幽灵原版日志】：
 * 系统原带的日志窗口被移出屏幕并隐藏，只负责跑数据，不负责显示。
 *
 * 使用此插件后，日志出现期间，玩家将完全无法操作，指令窗口也绝对无法弹出，
 * 直到日志淡出动画播放完毕。
 */

(function() {
    const parameters = PluginManager.parameters('Sq_BattleWindow');
    const battleWindowSkin = String(parameters['battleWindowSkin'] || 'Battlewindow');
    
    // 布局与动画
    const logFontSize = Number(parameters['logFontSize'] || 20);
    const logHeight = Number(parameters['logHeight'] || 70);
    const logBottomOffset = Number(parameters['logBottomOffset'] || 0);
    const logDelay = Number(parameters['logClearDelay'] || 60);
    const fadeInSpeed = Number(parameters['fadeInSpeed'] || 255);
    const fadeOutSpeed = Number(parameters['fadeOutSpeed'] || 25);

    // 颜色
    const colorActor = Number(parameters['actorNameColor'] || 4);
    const colorEnemy = Number(parameters['enemyNameColor'] || 2);
    const colorSkill = Number(parameters['skillNameColor'] || 14);

    // 图标
    const enemyIconSize = Number(parameters['enemyIconSize'] || 24);
    const enemyIconSpace = Number(parameters['enemyIconSpace'] || 2);
    const enemyIconMax = Number(parameters['enemyIconMax'] || 8);
    const enemyIconOffsetY = Number(parameters['enemyIconOffsetY'] || 0);

    // ========================================================================
    // 1. 窗口皮肤加载 (通用)
    // ========================================================================
    const _loadCustomSkin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    Window_PartyCommand.prototype.loadWindowskin = _loadCustomSkin;
    Window_BattleStatus.prototype.loadWindowskin = _loadCustomSkin;
    Window_ActorCommand.prototype.loadWindowskin = _loadCustomSkin;
    Window_Help.prototype.loadWindowskin         = _loadCustomSkin;
    Window_MenuCommand.prototype.loadWindowskin  = _loadCustomSkin;
    Window_MenuActor.prototype.loadWindowskin    = _loadCustomSkin;

    // ========================================================================
    // 2. 辅助工具
    // ========================================================================
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
                text = text.replace(reg, `\\C[${colorActor}]${name}\\C[0]`);
            }
        }
        const enemies = $gameTroop.members(); 
        for (const enemy of enemies) {
            const name = enemy.originalName();
            if (name && text.includes(name) && !text.includes(`]${name}`)) {
                const reg = new RegExp(escapeRegExp(name), 'g');
                text = text.replace(reg, `\\C[${colorEnemy}]${name}\\C[0]`);
            }
        }
        return text;
    }

    // ========================================================================
    // 3. [核心] Window_RainbowLog 
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
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    Window_RainbowLog.prototype.resetFontSettings = function() {
        Window_Base.prototype.resetFontSettings.call(this);
        this.contents.fontSize = logFontSize;
    };

    // 关键：只要不是空闲状态，就是“正在占用屏幕”
    Window_RainbowLog.prototype.isBlocking = function() {
        return this._state !== 'idle';
    };

    Window_RainbowLog.prototype.addLog = function(text) {
        this._lines = [text]; 
        this._waitCount = logDelay; 
        this.refresh();
        this.show();
        this.open();
        this.opacity = 0; // 初始透明，走淡入
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
                this.opacity = Math.min(this.opacity + fadeInSpeed, 255);
                this.contentsOpacity = Math.min(this.contentsOpacity + fadeInSpeed, 255);
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
                this.opacity -= fadeOutSpeed;
                this.contentsOpacity -= fadeOutSpeed;
                if (this.opacity <= 0) {
                    this.clearLog();
                }
                break;
        }
    };

    // ========================================================================
    // 4. [暴力修正] 场景层级压制
    // ========================================================================
    
    // 1. 劫持 isBusy，让逻辑停下来
    const _BattleManager_isBusy = BattleManager.isBusy;
    BattleManager.isBusy = function() {
        if (_BattleManager_isBusy.call(this)) return true;
        
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene._rainbowLogWindow) {
            // 只要日志窗口在工作，系统就是忙碌的！
            if (scene._rainbowLogWindow.isBlocking()) {
                return true; 
            }
        }
        return false;
    };

    // 2. 【核心修复】劫持指令窗口可见性更新
    // 原版这里会根据 BattleManager.isInputting() 自动显示窗口
    // 我们强行插入判断：如果日志在显示，给我闭嘴（隐藏）！
    const _Scene_Battle_updateInputWindowVisibility = Scene_Battle.prototype.updateInputWindowVisibility;
    Scene_Battle.prototype.updateInputWindowVisibility = function() {
        if (this._rainbowLogWindow && this._rainbowLogWindow.isBlocking()) {
            this.closeCommandWindows(); // 强制关闭所有指令窗口
            this.hideSubInputWindows(); // 强制隐藏子窗口
            return; // 不执行原版逻辑，直接跳过
        }
        _Scene_Battle_updateInputWindowVisibility.call(this);
    };

    // ========================================================================
    // 5. 场景挂载与原版日志阉割
    // ========================================================================
    
    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        
        // 阉割原版日志：移出屏幕，不可见
        if (this._logWindow) {
            this._logWindow.x = 20000;
            this._logWindow.visible = false;
        }

        this.createRainbowLogWindow();
    };

    Scene_Battle.prototype.createRainbowLogWindow = function() {
        const h = logHeight; 
        const w = Graphics.boxWidth;
        const x = 0;
        const y = Graphics.boxHeight - h - logBottomOffset;
        const rect = new Rectangle(x, y, w, h);
        this._rainbowLogWindow = new Window_RainbowLog(rect);
        this.addChild(this._rainbowLogWindow);
    };

    // 原版日志功能剥离
    Window_BattleLog.prototype.loadWindowskin = _loadCustomSkin;
    Window_BattleLog.prototype.drawBackground = function() { };
    Window_BattleLog.prototype.drawLineText = function(index) { };
    Window_BattleLog.prototype.refresh = function() { };
    // 强行设为不可见，防止闪烁
    Window_BattleLog.prototype.updateVisibilityByContent = function() { this.visible = false; };

    // 数据转发
    const _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        _Window_BattleLog_addText.call(this, text); 
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene._rainbowLogWindow) {
            const coloredText = colorizeText(text);
            scene._rainbowLogWindow.addLog(coloredText);
        }
    };

    const _Window_BattleLog_clear = Window_BattleLog.prototype.clear;
    Window_BattleLog.prototype.clear = function() {
        _Window_BattleLog_clear.call(this);
        // 不在这里清空彩虹窗口，让它自己跑完动画
    };

    const _Window_BattleLog_displayItemMessage = Window_BattleLog.prototype.displayItemMessage;
    Window_BattleLog.prototype.displayItemMessage = function(fmt, subject, item) {
        if (fmt) {
            const coloredItemName = `\\C[${colorSkill}]${item.name}\\C[0]`;
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
    // 6. 敌人状态图标
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
        if (icons.length > enemyIconMax) icons = icons.slice(0, enemyIconMax);

        const currentIconString = JSON.stringify(icons);
        if (this._lastIconListString !== currentIconString) {
            this._lastIconListString = currentIconString;
            this.refreshEnemyIcons(icons);
        }
        this.y += enemyIconOffsetY;
    };

    Sprite_StateIcon.prototype.refreshEnemyIcons = function(icons) {
        if (this.bitmap) { this.bitmap.destroy(); this.bitmap = null; }
        if (icons.length === 0) return;

        const iconSet = ImageManager.loadSystem("IconSet");
        if (!iconSet.isReady()) { this._lastIconListString = ""; return; }

        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const targetSize = enemyIconSize;
        const spacing = enemyIconSpace;
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