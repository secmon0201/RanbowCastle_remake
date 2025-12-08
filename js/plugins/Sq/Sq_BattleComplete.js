/*:
 * @target MZ
 * @plugindesc [战斗] 综合UI重构 & 全面防崩版 (v4.1 All-Safe)
 * @author 神枪手 (Merged & Fixed by Gemini)
 *
 * @help
 * ============================================================================
 * 插件说明 (v4.1 全面防御版)
 * ============================================================================
 * 本插件集成了以下功能，并修复了所有已知崩溃问题：
 * 1. 界面重构：全窗口位置自定义、头像优化。
 * 2. 核心修复：
 * - 修复 "setAttack of undefined" (点击攻击崩溃)
 * - 修复 "setSkill of undefined" (点击技能崩溃) <--- v4.1 新增
 * - 修复 "setItem of undefined" (点击物品崩溃)   <--- v4.1 新增
 * 3. 智能逻辑：优化了窗口激活逻辑，防止在TPB回合切换时误触。
 * 4. 状态锁定：状态窗口位置强制锁定与智能避让。
 *
 * ============================================================================
 * 参数设置区域
 * ============================================================================
 *
 * @param --- Battle Log General ---
 * @text [日志: 基础设置]
 * @default
 *
 * @param battleWindowSkin
 * @parent --- Battle Log General ---
 * @text 窗口皮肤名称
 * @desc 战斗窗口（含日志）使用的皮肤文件名（需放在img/system/）。
 * @default Battlewindow
 * @type string
 *
 * @param --- Battle Log Layout ---
 * @text [日志: 外观布局]
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
 * @text [日志: 逻辑设置]
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
 * @text [日志: 文本颜色]
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
 * @param --- Status Fixed ---
 * @text [状态栏固定设置]
 * @default
 * * @param fixedX
 * @parent --- Status Fixed ---
 * @text 固定X坐标
 * @desc 状态窗口固定的X坐标位置
 * @type number
 * @default 0
 * * @param fixedY
 * @parent --- Status Fixed ---
 * @text 固定Y坐标
 * @desc 状态窗口固定的Y坐标位置
 * @type number
 * @default 0
 * * @param fixedWidth
 * @parent --- Status Fixed ---
 * @text 固定宽度
 * @desc 状态窗口的固定宽度（留空则使用默认宽度）
 * @type number
 * @default 480
 * * @param fixedHeight
 * @parent --- Status Fixed ---
 * @text 固定高度
 * @desc 状态窗口的固定高度（留空则使用默认高度）
 * @type number
 * @default 
 */

(() => {
    // 获取合并后的插件参数
    const pluginName = "Sq_BattleComplete";
    const parameters = PluginManager.parameters(pluginName);

    // ========================================================================
    // ---------------------- MODULE 1: BATTLE LOG (Window) -------------------
    // ========================================================================
    
    // 参数解析 - 日志系统
    const battleWindowSkin = String(parameters['battleWindowSkin'] || 'Battlewindow');
    const logFontSize = Number(parameters['logFontSize'] || 20);
    const logHeight = Number(parameters['logHeight'] || 70);
    const logBottomOffset = Number(parameters['logBottomOffset'] || 0);
    const logDelay = Number(parameters['logClearDelay'] || 60);
    const fadeInSpeed = Number(parameters['fadeInSpeed'] || 255);
    const fadeOutSpeed = Number(parameters['fadeOutSpeed'] || 25);
    const colorActor = Number(parameters['actorNameColor'] || 4);
    const colorEnemy = Number(parameters['enemyNameColor'] || 2);
    const colorSkill = Number(parameters['skillNameColor'] || 14);
    const enemyIconSize = Number(parameters['enemyIconSize'] || 24);
    const enemyIconSpace = Number(parameters['enemyIconSpace'] || 2);
    const enemyIconMax = Number(parameters['enemyIconMax'] || 8);
    const enemyIconOffsetY = Number(parameters['enemyIconOffsetY'] || 0);

    // 1. 窗口皮肤加载 (通用)
    const _loadCustomSkin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    Window_PartyCommand.prototype.loadWindowskin = _loadCustomSkin;
    Window_BattleStatus.prototype.loadWindowskin = _loadCustomSkin;
    Window_ActorCommand.prototype.loadWindowskin = _loadCustomSkin;
    Window_Help.prototype.loadWindowskin         = _loadCustomSkin;
    Window_MenuCommand.prototype.loadWindowskin  = _loadCustomSkin;
    Window_MenuActor.prototype.loadWindowskin    = _loadCustomSkin;

    // 2. 辅助工具
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

    // 3. [核心] Window_RainbowLog 
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

    Window_RainbowLog.prototype.isBlocking = function() {
        return this._state !== 'idle';
    };

    Window_RainbowLog.prototype.addLog = function(text) {
        this._lines = [text]; 
        this._waitCount = logDelay; 
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

    // 4. [流程阻断与输入冷冻] 核心逻辑
    // -------------------------------------------------------------------------
    
    // 辅助函数：判断是否正在阻塞
    Scene_Battle.prototype.isRainbowBlocking = function() {
        return this._rainbowLogWindow && this._rainbowLogWindow.isBlocking();
    };

    const _BattleManager_isBusy = BattleManager.isBusy;
    BattleManager.isBusy = function() {
        if (_BattleManager_isBusy.call(this)) return true;
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene.isRainbowBlocking()) {
            return true; 
        }
        return false;
    };

    const _Window_BattleLog_isBusy = Window_BattleLog.prototype.isBusy;
    Window_BattleLog.prototype.isBusy = function() {
        if (_Window_BattleLog_isBusy.call(this)) return true;
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene.isRainbowBlocking()) {
            return true; 
        }
        return false;
    };

    const _Scene_Battle_updateBattleProcess = Scene_Battle.prototype.updateBattleProcess;
    Scene_Battle.prototype.updateBattleProcess = function() {
        if (this.isRainbowBlocking()) {
            return; 
        }
        _Scene_Battle_updateBattleProcess.call(this);
    };

    const _Window_Command_processHandling = Window_Command.prototype.processHandling;
    Window_Command.prototype.processHandling = function() {
        const scene = SceneManager._scene;
        if (scene instanceof Scene_Battle && scene.isRainbowBlocking()) {
            return; // 强制停止输入处理
        }
        _Window_Command_processHandling.call(this);
    };

    // [v4.0 核心重写：视觉看门狗逻辑优化]
    const _Scene_Battle_updateInputWindowVisibility = Scene_Battle.prototype.updateInputWindowVisibility;
    Scene_Battle.prototype.updateInputWindowVisibility = function() {
        // 1. 日志阻塞检测
        if (this.isRainbowBlocking()) {
            this.hideSubInputWindows();
            if (this._partyCommandWindow) this._partyCommandWindow.visible = false;
            if (this._actorCommandWindow) this._actorCommandWindow.visible = false;
            return; 
        }

        // 2. 协战队列检测
        if (BattleManager._secReactionQueue && BattleManager._secReactionQueue.length > 0) {
            this.hideSubInputWindows();
            if (this._partyCommandWindow) this._partyCommandWindow.visible = false;
            if (this._actorCommandWindow) this._actorCommandWindow.visible = false;
            return; 
        }

        // 3. 原版逻辑
        _Scene_Battle_updateInputWindowVisibility.call(this);

        // 4. [看门狗逻辑 - 智能安全版]
        if (BattleManager.isInputting()) {
            const isSubWindowActive = (this._skillWindow && this._skillWindow.active) || 
                                      (this._itemWindow && this._itemWindow.active) ||
                                      (this._actorWindow && this._actorWindow.active) ||
                                      (this._enemyWindow && this._enemyWindow.active);

            if (!isSubWindowActive) {
                const actor = BattleManager.actor();
                if (actor) {
                    // ★★★ 关键修改：只有当角色确实允许输入时，才强制显示窗口
                    if (actor.canInput()) { 
                        if (this._actorCommandWindow && !this._actorCommandWindow.visible) {
                            this._actorCommandWindow.show();
                            this._actorCommandWindow.activate();
                        }
                    }
                } else {
                    if (this._partyCommandWindow && !this._partyCommandWindow.visible) {
                        this._partyCommandWindow.show();
                        this._partyCommandWindow.activate();
                    }
                }
            }
        }
    };

    // 5. 场景挂载与原版日志阉割
    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
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

    // 6. 敌人状态图标
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


    // ========================================================================
    // ----------------------- MODULE 2: BATTLE UI (Rects) --------------------
    // ========================================================================

    Scene_Battle.prototype.statusWindowRect = function() {
        const extra = -1;
        const ww = 480;
        const wh = 200 + extra;
        const wx = 0;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

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

    Scene_Message.prototype.messageWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(4, false) + 8;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.partyCommandWindowRect = function() {
        const ww = 130;
        const wh = 200;
        const wx = 0;
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.actorCommandWindowRect = function() {
        const ww = 130;
        const wh = 200;
        const wx = 0;
        const wy = 70;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.enemyWindowRect = function() {
        const wx = 190;
        const ww = this._statusWindow.width;
        const wh = this.windowAreaHeight();
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.logWindowRect = function() {
        const wx = 0;
        const wy = 500;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(10, false);
        return new Rectangle(wx, wy, ww, wh);
    }

    Scene_Battle.prototype.createCancelButton = function() {
        this._cancelButton = new Sprite_Button("cancel");
        this._cancelButton.x = 10000;
        this._cancelButton.y = this.buttonY();
        this.addWindow(this._cancelButton);
    };

    Scene_Battle.prototype.helpWindowRect = function() {
        const wx = 0;
        const wy = -5;
        const ww = Graphics.boxWidth;
        const wh = this.helpAreaHeight();
        return new Rectangle(wx, wy, ww, wh);
    };


    // ========================================================================
    // ------------------- MODULE 3: STATUS WINDOW FIXED ----------------------
    // ========================================================================
    
    const parseParamSafe = (val, defaultVal) => {
        if (val === undefined || val === "") return defaultVal;
        const num = Number(val);
        return isNaN(num) ? defaultVal : num;
    };

    const fixedX = parseParamSafe(parameters['fixedX'], 0);
    const fixedY = parseParamSafe(parameters['fixedY'], 0); 
    const fixedWidth = parameters['fixedWidth'] ? parseInt(parameters['fixedWidth']) : null;
    const fixedHeight = parameters['fixedHeight'] ? parseInt(parameters['fixedHeight']) : null;

    // 固定状态窗口
    const _Scene_Battle_statusWindowRect = Scene_Battle.prototype.statusWindowRect;
    Scene_Battle.prototype.statusWindowRect = function() {
        const originalRect = _Scene_Battle_statusWindowRect.call(this);
        const ww = fixedWidth || originalRect.width;
        const wh = fixedHeight || originalRect.height;
        return new Rectangle(fixedX, fixedY, ww, wh);
    };

    const _Scene_Battle_createStatusWindow = Scene_Battle.prototype.createStatusWindow;
    Scene_Battle.prototype.createStatusWindow = function() {
        _Scene_Battle_createStatusWindow.call(this);
        if (this._statusWindow) {
            this._statusWindow.x = fixedX;
            this._statusWindow.y = fixedY;
            this._statusWindow._isFixedPosition = true;
        }
    };

    const _Window_Base_setX = Window_Base.prototype.setX;
    Window_Base.prototype.setX = function(x) {
        if (!this._isFixedPosition) {
            _Window_Base_setX.call(this, x);
        }
    };

    const _Window_Base_setY = Window_Base.prototype.setY;
    Window_Base.prototype.setY = function(y) {
        if (!this._isFixedPosition) {
            _Window_Base_setY.call(this, y);
        }
    };

    // ========================================================================
    // ------------------- MODULE 4: ULTRA CRASH FIXES ------------------------
    // ========================================================================
    
    // 通用：安全获取 Action 的函数
    function getSafeAction(instance) {
        let action = BattleManager.inputtingAction();
        const actor = BattleManager.actor();
        
        if (!action && actor) {
            console.warn("⚠️ [Sq_BattleComplete] 动作槽丢失，正在修复...");
            // 如果动作列表是空的，强制初始化
            if (actor.numActions() === 0) actor.makeActions();
            action = BattleManager.inputtingAction();
        }
        
        if (!action) {
            console.error("❌ [Sq_BattleComplete] 动作对象仍为空，操作被拦截。");
            SoundManager.playBuzzer();
            if (instance && instance.commandCancel) {
                instance.commandCancel();
            } else if (instance && instance.onCancel) {
                instance.onCancel();
            }
            return null;
        }
        return action;
    }

    // 1. [修复] 攻击指令 (setAttack of undefined)
    Scene_Battle.prototype.commandAttack = function() {
        const action = getSafeAction(this);
        if (action) {
            action.setAttack();
            this.onSelectAction();
        }
        // 恢复状态窗口显示
        if (this._statusWindow) {
            this._statusWindow.visible = true;
            this._statusWindow.x = fixedX;
            this._statusWindow.y = fixedY;
        }
    };

    // 2. [修复] 技能指令 (setSkill of undefined)
    Scene_Battle.prototype.onSkillOk = function() {
        const skill = this._skillWindow.item();
        const action = getSafeAction(this);
        if (action) {
            action.setSkill(skill.id);
            BattleManager.actor().setLastBattleSkill(skill);
            this.onSelectAction();
        }
    };

    // 3. [修复] 物品指令 (setItem of undefined)
    Scene_Battle.prototype.onItemOk = function() {
        const item = this._itemWindow.item();
        const action = getSafeAction(this);
        if (action) {
            action.setItem(item.id);
            $gameParty.setLastItem(item);
            this.onSelectAction();
        }
    };

    // 4. [修复] 防御指令 (setGuard of undefined)
    Scene_Battle.prototype.commandGuard = function() {
        const action = getSafeAction(this);
        if (action) {
            action.setGuard();
            this.onSelectAction();
        }
    };

    // 5. 界面更新与坐标同步
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        
        const action = BattleManager.inputtingAction();
        const isNormalAttack = action ? action.isAttack() : false;
        const isMessagePlaying = $gameMessage.isBusy();

        const isBrowsingList = (this._skillWindow && this._skillWindow.active) || 
                               (this._itemWindow && this._itemWindow.active);
        const isSelectingActor = (this._actorWindow && this._actorWindow.active);
        const isSelectingEnemyWithSkill = (this._enemyWindow && this._enemyWindow.active) && !isNormalAttack;

        if (this._statusWindow) {
            if (isBrowsingList || isSelectingEnemyWithSkill || isMessagePlaying) {
                this._statusWindow.visible = false;
            } else {
                if (!BattleManager.isBattleEnd()) {
                    if (!this._statusWindow.visible) this._statusWindow.visible = true;
                }
                if (this._statusWindow.x !== fixedX) this._statusWindow.x = fixedX;
                if (this._statusWindow.y !== fixedY) this._statusWindow.y = fixedY;
            }
        }

        if (this._actorWindow && this._statusWindow) {
            this._actorWindow.x = this._statusWindow.x;
            this._actorWindow.y = this._statusWindow.y;
            this._actorWindow.width = this._statusWindow.width;
            this._actorWindow.height = this._statusWindow.height;
            
            if (isSelectingActor) {
                 this._actorWindow.visible = true;
                 this._actorWindow.cursorVisible = true;
            }
        }

        if (this._helpWindow) {
            if (isSelectingActor) {
                this._helpWindow.visible = false;
            }
        }
    };
    
})();