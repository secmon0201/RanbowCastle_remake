/*:
 * @target MZ
 * @plugindesc [系统] 菜单界面UI完全重绘 & 新存档界面 & 全局渐变光标 (彩虹城堡重置版专用 - 修复版)
 * @author 神枪手 & Gemini Optimization
 *
 * @param enableLoadCommand
 * @text 启用菜单读档指令
 * @type boolean
 * @default true
 * @desc 是否在主菜单命令窗口中添加“读档”选项。
 *
 * @param --- Cursor Settings ---
 * @text [光标设置]
 *
 * @param CursorColorStart
 * @parent --- Cursor Settings ---
 * @text 渐变起始色
 * @desc 选中项背景渐变的起始颜色 (CSS格式)
 * @default rgba(255, 215, 0, 0.25)
 *
 * @param CursorColorEnd
 * @parent --- Cursor Settings ---
 * @text 渐变结束色
 * @desc 选中项背景渐变的结束颜色 (CSS格式)
 * @default rgba(0, 0, 0, 0)
 *
 * @param CursorBorderColor
 * @parent --- Cursor Settings ---
 * @text 边框颜色
 * @desc 选中项边框的颜色 (CSS格式)
 * @default rgba(255, 215, 0, 0.6)
 *
 * @help
 * ============================================================================
 * 🌈 彩虹城堡重置版 - UI 核心系统 (v2.1 修复整合版)
 * ============================================================================
 * 本插件是专为《彩虹城堡》重制版定制的UI核心系统。
 * 已集成 Sq_GlobalGradientCursor 的全部功能。
 * * * 适配分辨率: 480x854 (竖屏)
 *
 * ============================================================================
 * ✨ 包含功能 (Features)
 * ============================================================================
 * 1. [UI重构] 主菜单、物品、技能、装备、状态、存档、商店界面全重写。
 * 2. [视觉风格] 强制不透明背景，模拟 J2ME 硬朗风格。
 * 3. [组件] 荧光风格计量槽 (HP/MP/TP)。
 * 4. [交互] 全局金黄色渐变光标 (自动替换系统默认闪烁框)。
 * 5. [优化] 列表滚动性能优化，防止手机端掉帧。
 *
 * ============================================================================
 * 资源依赖 (Resources)
 * ============================================================================
 * 请确保 img/pictures/ 目录下包含以下文件：
 * - Menu.png    (全局菜单背景，建议尺寸 480x854)
 * - hpicon.png, mpicon.png, tpicon.png (计量槽图标)
 * - lvicon.png  (等级图标)
 *
 * 请确保 img/system/ 目录下包含以下文件：
 * - Battlewindow.png (主窗口皮肤)
 *
 */

(() => {
    'use strict';

    // 获取插件参数
    const pluginParams = PluginManager.parameters('Sq_MenuUI');
    const enableLoadCommand = pluginParams.enableLoadCommand === 'true';
    
    // 光标颜色配置 (J2ME 金色风格)
    const CURSOR_CONFIG = {
        color1: pluginParams.CursorColorStart || "rgba(255, 215, 0, 0.25)",
        color2: pluginParams.CursorColorEnd   || "rgba(0, 0, 0, 0)",
        border: pluginParams.CursorBorderColor || "rgba(255, 215, 0, 0.6)"
    };

    // ========================================================================
    // [Core Module] 资源预加载与系统初始化
    // ========================================================================
    const _Scene_Boot_loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {
        _Scene_Boot_loadSystemImages.call(this);
        ColorManager.loadWindowskin();
        ImageManager.loadSystem("IconSet");
        
        // 加载 UI 核心图标组件
        ImageManager.loadPicture("hpicon");
        ImageManager.loadPicture("mpicon");
        ImageManager.loadPicture("tpicon");
        ImageManager.loadPicture("lvicon");
        
        // 预加载全局菜单背景
        ImageManager.loadPicture("Menu");
        
        // 预加载 J2ME 风格专用窗口皮肤
        ImageManager.loadSystem("Battlewindow");
    };

    // ========================================================================
    // [UI Component] Sprite_MenuGauge (荧光风格计量槽)
    // ========================================================================
    class Sprite_MenuGauge extends Sprite_Gauge {
        constructor() {
            super();
        }

        // [Layout] 宽度适配右侧窗口
        bitmapWidth() { return 145; } 
        bitmapHeight() { return 32; }
        gaugeHeight() { return 14; }

        gaugeBackColor() { return "#202020"; }

        gaugeColor1() {
            switch (this._statusType) {
                case "hp": return "#ff6b6b"; // 亮红
                case "mp": return "#4d96ff"; // 亮蓝
                case "tp": return "#6bc547"; // 亮绿
                default: return "#ffffff";
            }
        }

        gaugeColor2() {
            switch (this._statusType) {
                case "hp": return "#ff9f43"; // 橙色过渡
                case "mp": return "#54a0ff"; // 浅蓝过渡
                case "tp": return "#95d5b2"; // 浅绿过渡
                default: return "#ffffff";
            }
        }

        drawGaugeRect(x, y, width, height) {
            this.bitmap.fillRect(x, y, width, height, "rgba(0,0,0,0.5)");
            super.drawGaugeRect(x + 1, y + 1, width - 2, height - 2);
        }

        drawLabel() {
            const iconName = this.gaugeIcon();
            if (!iconName) return;
            const bitmap = ImageManager.loadPicture(iconName);
            const iconX = 0; 
            const iconY = 12; 
            const iconSize = 12; 
            
            const drawIcon = () => {
                if (!this.bitmap || !this.bitmap.context) return;
                this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
            };

            if (bitmap.isReady()) {
                drawIcon();
            } else {
                bitmap.addLoadListener(drawIcon);
            }
        }

        gaugeIcon() {
            switch (this._statusType) {
                case "hp": return "hpicon";
                case "mp": return "mpicon";
                case "tp": return "tpicon";
                default: return null;
            }
        }

        drawValue() {
            const currentValue = this.currentValue();
            const currentMaxValue = this.currentMaxValue();
            const width = this.bitmapWidth();
            const height = this.textHeight();
            let str = `/${currentMaxValue}`;
            let maxValueWidth = this.bitmap.measureTextWidth(str);
            
            this.bitmap.textColor = "rgba(255, 255, 255, 1)";
            this.bitmap.fontSize = 18; 
            this.bitmap.drawText(currentValue, 0, -4, width - maxValueWidth + 2, height, "right");
            
            this.bitmap.textColor = "rgba(255, 255, 255, 0.7)";
            this.bitmap.fontSize = 12;
            this.bitmap.drawText(`/${currentMaxValue}`, width - maxValueWidth, -2, maxValueWidth, height, "right");
        }
    }
    window.Sprite_MenuGauge = Sprite_MenuGauge;

    // ========================================================================
    // [Module 1] 主菜单与通用背景 (Main Menu & Background)
    // ========================================================================

    Scene_MenuBase.prototype.createBackground = function() {
        this._backgroundFilter = new PIXI.filters.BlurFilter();
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = ImageManager.loadPicture("Menu");
        this._backgroundSprite.filters = [];
        this.addChild(this._backgroundSprite);
        this.setBackgroundOpacity(255);
    };

    Scene_Menu.prototype.commandWindowRect = function() {
        const ww = 140;
        const wh = 490; 
        const wx = 0;
        const wy = -5;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.statusWindowRect = function() {
        const ww = 340; 
        const wh = 854; 
        const wx = 140;
        const wy = -5;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.goldWindowRect = function() {
        const ww = 144;    
        const wh = 70;     
        const wx = 0;      
        const wy = 854 - wh - 5; 
        return new Rectangle(wx, wy, ww, wh);
    };

    Window_Gold.prototype.refresh = function() {
        const rect = this.itemLineRect(0);
        this.contents.clear();
        const oldSize = this.contents.fontSize;
        this.contents.fontSize = 20; 
        this.drawCurrencyValue(this.value(), this.currencyUnit(), rect.x, rect.y, rect.width);
        this.contents.fontSize = oldSize;
    };

    // ========================================================================
    // [Module 1.1] 主菜单状态绘制 (Window_MenuStatus 重构)
    // ========================================================================
    Window_MenuStatus.prototype.maxCols = function () { return 1; };
    Window_MenuStatus.prototype.numVisibleRows = function() { return 4; };
    Window_MenuStatus.prototype.itemHeight = function() {
        const contentHeight = this.height - this.padding * 2;
        return Math.floor(contentHeight / 4);
    };
    Window_MenuStatus.prototype.maxItems = function() {
        return $gameParty.members().length;
    };

    Window_MenuStatus.prototype.drawItem = function(index) {
        // 【关键改动】主动调用 drawItemBackground 以触发渐变光标
        this.drawItemBackground(index);

        const rect = this.itemRect(index);
        const faceSize = 144; 
        
        const offsetY = Math.floor((rect.height - faceSize) / 2); 

        this._tempParams = { 
            faceSize: faceSize,
            offsetY: offsetY,
            faceX: rect.x + 4, 
            faceY: rect.y + offsetY
        };

        this.drawPendingItemBackground(index);
        this.drawItemImage(index);   
        this.drawSlotCardBg(index);  
        this.drawItemStatus(index);  
    };

    Window_MenuStatus.prototype.drawItemImage = function(index) {
        const actor = this.actor(index);
        const p = this._tempParams;
        if (!actor || !p) return;
        this.drawActorFace(actor, p.faceX, p.faceY, p.faceSize, p.faceSize);
    };

    Window_MenuStatus.prototype.drawSlotCardBg = function(index) {
        const p = this._tempParams;
        if (!p) return;
        const x = p.faceX;
        const y = p.faceY;
        const s = p.faceSize;

        // 边框绘制逻辑已在 Module 10 中优化，此处保留基础调用结构
        this.contents.strokeRect(x, y, s, s, "rgba(255, 215, 0, 0.8)"); 
        this.contents.strokeRect(x - 1, y - 1, s + 2, s + 2, "rgba(0, 0, 0, 0.5)"); 
    };

    Window_MenuStatus.prototype.drawItemStatus = function(index) {
        const actor = this.actor(index);
        const p = this._tempParams;
        if (!actor || !p) return;
        
        const dataX = p.faceX + p.faceSize + 10; 
        const startY = p.faceY; 

        // Row 1: 名字
        this.contents.fontSize = 26; 
        this.contents.fontBold = true; 
        this.changeTextColor('#FFD700'); 
        this.drawText(actor.name(), dataX, startY, 150);
        this.contents.fontBold = false; 

        // Row 2: 等级/职业
        const row2Y = startY + 32;
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconX = dataX;
        const lvIconY = row2Y + 12; 
        
        const drawLvStuff = () => {
            if (!this.contents || !this.contents.context) return;
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, lvIconX, lvIconY);
            
            const numX = lvIconX + 24; 
            this.resetTextColor();
            this.contents.fontSize = 20;
            this.changeTextColor('#00FFFF'); 
            this.drawText(actor.level, numX, row2Y + 2, 40);

            const classX = numX + 36; 
            this.contents.fontSize = 16;
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); 
            this.drawText(actor.currentClass().name, classX, row2Y + 4, 100);
        };

        if (lvIcon.width > 0) drawLvStuff(); else lvIcon.addLoadListener(drawLvStuff);

        // Row 3 & 4: 计量槽
        let gaugeY = row2Y + 34;
        const gaugeSpacing = 32;

        this.placeGauge(actor, "hp", dataX, gaugeY);
        this.placeGauge(actor, "mp", dataX, gaugeY + gaugeSpacing); 
        
        if ($dataSystem.optDisplayTp) {
            this.placeGauge(actor, "tp", dataX, gaugeY + gaugeSpacing * 2);
        }
    };

    Window_MenuStatus.prototype.placeGauge = function(actor, type, x, y) {
        const key = `actor${actor.actorId()}-gauge-${type}`;
        const sprite = this.createInnerSprite(key, Sprite_MenuGauge);
        sprite.setup(actor, type);
        sprite.move(x, y);
        sprite.show();
    };

    // ========================================================================
    // [Module 2] 菜单命令扩展 (读档功能)
    // ========================================================================
    const _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
    Window_MenuCommand.prototype.makeCommandList = function() {
        _Window_MenuCommand_makeCommandList.call(this);
        if (enableLoadCommand && !this._list.some(cmd => cmd.symbol === "load")) {
            this.addLoadCommand();
        }
    };

    Window_MenuCommand.prototype.addLoadCommand = function() {
        const enabled = this.isLoadEnabled();
        this.addCommand("读档", "load", enabled);
    };

    Window_MenuCommand.prototype.isLoadEnabled = function() {
        return !$gameParty.inBattle();
    };

    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        if (enableLoadCommand) {
            this._commandWindow.setHandler("load", this.commandLoad.bind(this));
        }
    };

    Scene_Menu.prototype.commandLoad = function() {
        this._commandWindow.close();
        SceneManager.push(Scene_Load);
    };

   // ========================================================================
    // [Module 3] 二级菜单重构 (Skill, Item 等)
    // ========================================================================

    Window_MenuActor.prototype.initialize = function(rect) {
        rect.x = 0;
        rect.y = 0;
        rect.width = 400;
        rect.height = Graphics.boxHeight - 120; 
        Window_MenuStatus.prototype.initialize.call(this, rect);
        this.hide();
    };

    const _original_Window_SkillList_initialize = Window_SkillList.prototype.initialize;
    Window_SkillList.prototype.initialize = function(rect) {
        if (SceneManager._scene instanceof Scene_Skill) {
            rect.x = 0;        
            rect.y = 180; 
            rect.width = 480;
            rect.height = 240; 
            Window_Selectable.prototype.initialize.call(this, rect);
            this._actor = null;
            this._stypeId = 0;
            this._data = [];
        } else {
            _original_Window_SkillList_initialize.call(this, rect);
        }
    };

    Window_SkillType.prototype.initialize = function(rect) {
        const typeWidth = 110; 
        rect.width = typeWidth;    
        rect.x = Graphics.boxWidth - typeWidth; 
        rect.y = 0;         
        rect.height = 180;   
        Window_Command.prototype.initialize.call(this, rect);
        this._actor = null;
    };

    Window_SkillStatus.prototype.initialize = function(rect) {
        const typeWidth = 110; 
        rect.x = 0;                
        rect.y = 0;               
        rect.width = Graphics.boxWidth - typeWidth; 
        rect.height = 180;
        Window_StatusBase.prototype.initialize.call(this, rect);
        this._actor = null;
    };

    Window_SkillStatus.prototype.setActor = function(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    };

    Window_SkillStatus.prototype.refresh = function() {
        Window_StatusBase.prototype.refresh.call(this);
        if (this._actor) {
            this.drawCurrentActorStatus();
        }
    };

    Window_SkillStatus.prototype.drawCurrentActorStatus = function() {
        const actor = this._actor;
        if (!actor) return;

        const faceSize = 144;
        const faceY = Math.floor((this.innerHeight - faceSize) / 2); 
        const faceX = 6; 

        this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.6)");
        this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(faceX - 1, faceY - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");

        this.drawActorFace(actor, faceX, faceY, faceSize, faceSize);

        const dataX = faceX + faceSize + 16; 
        const startY = faceY; 

        this.contents.fontSize = 26;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); 
        this.drawText(actor.name(), dataX, startY, 180); 
        this.contents.fontBold = false;

        const row2Y = startY + 32;
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconY = row2Y + 12; 
        
        const drawLv = () => {
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, dataX, lvIconY);
            
            this.resetTextColor();
            this.contents.fontSize = 20; 
            this.changeTextColor('#00FFFF'); 
            this.drawText(actor.level, dataX + 24, row2Y + 2, 40);

            this.contents.fontSize = 16; 
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); 
            this.drawText(actor.currentClass().name, dataX + 60, row2Y + 4, 120);
        };
        
        if (lvIcon.width > 0) drawLv(); else lvIcon.addLoadListener(drawLv);

        let gaugeY = row2Y + 34;
        const gaugeSpacing = 32;

        this.placeGauge(actor, "hp", dataX, gaugeY);
        this.placeGauge(actor, "mp", dataX, gaugeY + gaugeSpacing);

        if ($dataSystem.optDisplayTp) {
            this.placeGauge(actor, "tp", dataX, gaugeY + gaugeSpacing * 2);
        }
    };

    Window_SkillStatus.prototype.placeGauge = function(actor, type, x, y) {
        const key = `skill-status-${actor.actorId()}-${type}`;
        const sprite = this.createInnerSprite(key, Sprite_MenuGauge);
        sprite.setup(actor, type);
        sprite.move(x, y);
        sprite.show();
    };

    Window_SkillStatus.prototype.gaugeLineHeight = function() {
        return 24; 
    };

    // --- 技能帮助/故事窗口 ---
    function Window_SkillHelp() {
        this.initialize(...arguments);
    }
    Window_SkillHelp.prototype = Object.create(Window_Base.prototype);
    Window_SkillHelp.prototype.constructor = Window_SkillHelp;
    Window_SkillHelp.storyContentSize = 18;  

    Window_SkillHelp.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
        this.padding = 12;
    };

    Window_SkillHelp.prototype.resetFontSettings = function() {
        this.contents.fontFace = $gameSystem.mainFontFace();
        this.contents.fontSize = Window_SkillHelp.storyContentSize;
        this.resetTextColor();
    };

    Window_SkillHelp.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    Window_SkillHelp.prototype.clear = function() {
        this.setItem(null);
    };

    Window_SkillHelp.prototype.refresh = function() {
        this.contents.clear();
        if (!this._item) return;

        let text = this._item.meta.skillStory || this._item.meta.itemStory;
        if (!text) {
            text = this._item.description;
        }
        if (!text) return;

        let y = this.padding;
        this.contents.fontSize = Window_SkillHelp.storyContentSize;
        
        if (this._item.meta.skillStory || this._item.meta.itemStory) {
            this.changeTextColor("#e6c510");
        } else {
            this.resetTextColor();
        }
        
        this.drawTextEx(text, this.padding, y, this.contents.width - this.padding * 2);
    };

    Scene_Skill.prototype.createHelpWindow = function() {
        const wx = 0;
        const wy = 420; 
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy; 
        
        this._helpWindow = new Window_SkillHelp(new Rectangle(wx, wy, ww, wh));
        this.addWindow(this._helpWindow);
    };

    const _Window_SkillList_updateHelp = Window_SkillList.prototype.updateHelp;
    Window_SkillList.prototype.updateHelp = function() {
        if (SceneManager._scene instanceof Scene_Skill && this._helpWindow) {
            this._helpWindow.setItem(this.item());
        } else {
            _Window_SkillList_updateHelp.call(this);
        }
    };

    const _Scene_Skill_start = Scene_Skill.prototype.start;
    Scene_Skill.prototype.start = function() {
        _Scene_Skill_start.call(this);
        this._helpWindow?.clear();
    };

    // ========================================================================
    // [Module 4] 装备界面重构 (Scene_Equip)
    // ========================================================================

    const SQ_EQUIP_CONFIG = {
        statusH: 220,       
        cmdH: 70,           
        slotLines: 5,       
        faceSize: 144,      
        fontSize: {         
            name: 26,       
            level: 20,      
            paramLabel: 18, 
            paramVal: 20    
        }
    };

    Scene_Equip.prototype.statusWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, SQ_EQUIP_CONFIG.statusH);
    };

    Scene_Equip.prototype.commandWindowRect = function() {
        const sRect = this.statusWindowRect();
        return new Rectangle(0, sRect.height, Graphics.boxWidth, SQ_EQUIP_CONFIG.cmdH);
    };

    Scene_Equip.prototype.slotWindowRect = function() {
        const cRect = this.commandWindowRect();
        const wy = cRect.y + cRect.height;
        const wh = this.calcWindowHeight(SQ_EQUIP_CONFIG.slotLines, false) + 52;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    Scene_Equip.prototype.itemWindowRect = function() {
        return this.slotWindowRect();
    };

    Window_EquipItem.prototype.drawItem = function(index) {
        const item = this.itemAt(index);
        const rect = this.itemLineRect(index);

        if (item) {
            this.drawItemName(item, rect.x, rect.y, rect.width);
        } else {
            this.contents.fontSize = 22; 
            this.changeTextColor("#eff313ff"); 
            this.drawText("卸下当前装备", rect.x, rect.y, rect.width, "center");
            this.resetFontSettings();
        }
    };
    
    Window_EquipItem.prototype.includes = function(item) {
        if (item === null) {
            return this._actor && this._actor.isEquipChangeOk(this._slotId);
        }
        return (
            this._actor &&
            this._actor.canEquip(item) &&
            item.etypeId === this._actor.equipSlots()[this._slotId]
        );
    };

    Scene_Equip.prototype.helpWindowRect = function() {
        const sRect = this.slotWindowRect();
        const wy = sRect.y + sRect.height; 
        const wh = Graphics.boxHeight - wy;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // --- 装备描述窗口 ---
    function Window_EquipHelp() {
        this.initialize(...arguments);
    }
    Window_EquipHelp.prototype = Object.create(Window_Base.prototype);
    Window_EquipHelp.prototype.constructor = Window_EquipHelp;
    
    Window_EquipHelp.storyContentSize = 18;  

    Window_EquipHelp.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
        this.padding = 12;
        
        this.loadWindowskin(); 
        this.backOpacity = 255; 
        this.opacity = 255;     
    };

    Window_EquipHelp.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem("Battlewindow");
    };

    Window_EquipHelp.prototype.resetFontSettings = function() {
        this.contents.fontFace = $gameSystem.mainFontFace();
        this.contents.fontSize = Window_EquipHelp.storyContentSize;
        this.resetTextColor();
    };

    Window_EquipHelp.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    Window_EquipHelp.prototype.clear = function() {
        this.setItem(null);
    };

    Window_EquipHelp.prototype.refresh = function() {
        this.contents.clear();
        if (!this._item) return;

        let text = this._item.meta.equipStory || this._item.meta.itemStory;
        let isStory = true;

        if (!text) {
            text = this._item.description;
            isStory = false;
        }

        if (!text) return;

        let y = this.padding;
        
        this.resetFontSettings();
        
        if (isStory) {
            this.changeTextColor("#e6c510"); // 金色
        } else {
            this.resetTextColor(); // 白色
        }
        
        this.drawTextEx(text, this.padding, y, this.contents.width - this.padding * 2);
    };

    Scene_Equip.prototype.createHelpWindow = function() {
        const rect = this.helpWindowRect();
        this._helpWindow = new Window_EquipHelp(rect);
        this.addWindow(this._helpWindow);
    };

    // --- 装备状态窗口 ---
    const _Window_EquipStatus_initialize = Window_EquipStatus.prototype.initialize;
    Window_EquipStatus.prototype.initialize = function(rect) {
        _Window_EquipStatus_initialize.call(this, rect); 
        this._actor = null;       
        this._tempActor = null;   
        this.refresh();           
    };

    Window_EquipStatus.prototype.refresh = function() {
        this.contents.clear();
        if (this._actor) {
            this.drawFaceWithFrame();
            this.drawHeaderInfo();
            this.drawParameters();
        }
    };

    Window_EquipStatus.prototype.drawFaceWithFrame = function() {
        const faceSize = SQ_EQUIP_CONFIG.faceSize;
        const faceY = Math.floor((this.innerHeight - faceSize) / 2);
        const faceX = 6; 
        this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.6)");
        this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(faceX - 1, faceY - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");
        this.drawActorFace(this._actor, faceX, faceY, faceSize, faceSize);
    };

    Window_EquipStatus.prototype.drawHeaderInfo = function() {
        const startX = SQ_EQUIP_CONFIG.faceSize + 16; 
        const startY = 12;       
        this.contents.fontSize = SQ_EQUIP_CONFIG.fontSize.name;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); 
        this.drawText(this._actor.name(), startX, startY, 180);
        this.contents.fontBold = false;

        const row2Y = startY + 34;
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconY = row2Y + 6; 
        
        const drawExtra = () => {
            if (!this.contents || !this.contents.context) return;

            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, startX, lvIconY);
            this.resetTextColor();
            this.contents.fontSize = SQ_EQUIP_CONFIG.fontSize.level;
            this.changeTextColor('#00FFFF'); 
            this.drawText(this._actor.level, startX + 24, row2Y, 40);
            this.contents.fontSize = 16;
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); 
            this.drawText(this._actor.currentClass().name, startX + 60, row2Y + 2, 120);
        };
        if (lvIcon.width > 0) drawExtra(); else lvIcon.addLoadListener(drawExtra);
    };

    Window_EquipStatus.prototype.drawParameters = function() {
        const startX = SQ_EQUIP_CONFIG.faceSize + 16; 
        const startY = 74; 
        const lineHeight = 34;
        const colWidth = 150; 

        for (let i = 0; i < 6; i++) {
            const col = i % 2; 
            const row = Math.floor(i / 2);
            const x = startX + col * colWidth;
            const y = startY + row * lineHeight;
            this.drawOneParam(x, y, colWidth, 2 + i); 
        }
    };

    Window_EquipStatus.prototype.drawOneParam = function(x, y, width, paramId) {
        const labelW = 50; 
        this.resetFontSettings();
        this.contents.fontSize = SQ_EQUIP_CONFIG.fontSize.paramLabel;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.param(paramId), x, y, labelW);

        const curVal = this._actor.param(paramId);
        this.resetTextColor();
        this.contents.fontSize = SQ_EQUIP_CONFIG.fontSize.paramVal;
        this.drawText(curVal, x + labelW, y, 40, "right");

        if (this._tempActor) {
             const newVal = this._tempActor.param(paramId);
             const diff = newVal - curVal;
             if (diff !== 0) {
                 this.changeTextColor(ColorManager.systemColor());
                 this.contents.fontSize = 16;
                 this.drawText("→", x + labelW + 42, y, 20, "center");
                 this.changeTextColor(ColorManager.paramchangeTextColor(diff));
                 this.contents.fontSize = SQ_EQUIP_CONFIG.fontSize.paramVal;
                 this.drawText(newVal, x + labelW + 62, y, 40, "left");
             }
        }
    };

    Window_EquipCommand.prototype.itemTextAlign = function() {
        return "center"; 
    };

    Window_EquipSlot.prototype.maxCols = function() { return 1; };

    // ========================================================================
    // [Module 5] 状态界面重构 (Scene_Status)
    // ========================================================================

    Scene_Status.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createProfileWindow();
        this.createMainStatusWindow();
    };

    Scene_Status.prototype.statusWindowRect = function() {
        const wy = 0;
        const wh = Graphics.boxHeight - 110; 
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    Scene_Status.prototype.profileWindowRect = function() {
        const wy = Graphics.boxHeight - 110;
        const wh = 110;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    Scene_Status.prototype.createMainStatusWindow = function() {
        const rect = this.statusWindowRect();
        this._statusWindow = new Window_StatusMain(rect);
        this._statusWindow.setHandler("cancel", this.popScene.bind(this));
        this._statusWindow.setHandler("pagedown", this.nextActor.bind(this));
        this._statusWindow.setHandler("pageup", this.previousActor.bind(this));
        this.addWindow(this._statusWindow);
    };

    Scene_Status.prototype.createProfileWindow = function() {
        const rect = this.profileWindowRect();
        this._profileWindow = new Window_Help(rect);
        this._profileWindow.loadWindowskin = function() {
            this.windowskin = ImageManager.loadSystem("Battlewindow");
        };
        this._profileWindow.refresh();
        this.addWindow(this._profileWindow);
    };

    Scene_Status.prototype.refreshActor = function() {
        const actor = this.actor();
        this._statusWindow.setActor(actor);
        this._profileWindow.setText(actor.profile()); 
    };

    // [Custom Window] Window_StatusMain
    
    function Window_StatusMain() {
        this.initialize(...arguments);
    }
    Window_StatusMain.prototype = Object.create(Window_StatusBase.prototype);
    Window_StatusMain.prototype.constructor = Window_StatusMain;

    Window_StatusMain.prototype.initialize = function(rect) {
        Window_StatusBase.prototype.initialize.call(this, rect);
        this._actor = null;
        
        this.loadWindowskin(); 
        this.backOpacity = 255; 
        this.opacity = 255; 
        
        this.refresh();
        this.activate();
    };

    Window_StatusMain.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem("Battlewindow");
    };

    Window_StatusMain.prototype.setActor = function(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    };

    Window_StatusMain.prototype.refresh = function() {
        this.contents.clear();
        if (this.hideAdditionalSprites) this.hideAdditionalSprites(); 
        
        if (this._actor) {
            const padding = 12;
            
            this.drawHeaderSection(padding, 12);
            this.drawParametersSection(padding, 185);
            this.drawEquipSection(padding, 465);
        }
    };

    Window_StatusMain.prototype.drawSectionBg = function(x, y, width, height) {
        this.contents.fillRect(x, y, width, height, "rgba(0, 0, 0, 0.3)");
        this.contents.fillRect(x, y, width, 2, "rgba(255, 255, 255, 0.1)");
        this.contents.fillRect(x, y + height - 1, width, 1, "rgba(0, 0, 0, 0.5)");
    };

    Window_StatusMain.prototype.drawHeaderSection = function(x, y) {
        const actor = this._actor;
        const faceSize = 144;
        
        this.drawActorFace(actor, x + 6, y, faceSize, faceSize);
        this.contents.strokeRect(x + 6, y, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(x + 5, y - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");

        const infoX = x + faceSize + 24; 
        let currentY = y; 

        this.contents.fontSize = 28;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); 
        this.drawText(actor.name(), infoX, currentY, 200);
        this.contents.fontBold = false;
        
        currentY += 36;

        const lvIcon = ImageManager.loadPicture("lvicon");
        const drawLvY = currentY; 
        
        const drawLv = () => {
            if (!this.contents || !this.contents.context) return;

            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, infoX, drawLvY + 6);
            
            this.resetTextColor();
            this.contents.fontSize = 22;
            this.changeTextColor('#00FFFF');
            this.drawText(actor.level, infoX + 28, drawLvY, 50);

            this.contents.fontSize = 18;
            this.changeTextColor("rgba(200, 200, 200, 0.9)");
            this.drawText(actor.currentClass().name, infoX + 70, drawLvY + 2, 140);
        };
        if(lvIcon.width > 0) drawLv(); else lvIcon.addLoadListener(drawLv);

        currentY += 22;

        this.contents.fontSize = 16;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("经验值:", infoX, currentY, 40);
        this.resetTextColor();
        this.drawText(actor.currentExp(), infoX + 40, currentY, 80);

        if (!actor.isMaxLevel()) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("下一级所需:", infoX + 110, currentY, 60);
            this.resetTextColor();
            this.drawText(actor.nextRequiredExp(), infoX + 150, currentY, 60, "right");
        } else {
            this.changeTextColor("#e6c510");
            this.drawText("MAX LEVEL", infoX + 110, currentY, 100, "right");
        }

        currentY += 34;

        const gaugeSpacing = 30;
        this.placeGauge(actor, "hp", infoX, currentY);
        currentY += gaugeSpacing;
        this.placeGauge(actor, "mp", infoX, currentY);
        if ($dataSystem.optDisplayTp) {
            currentY += gaugeSpacing;
            this.placeGauge(actor, "tp", infoX, currentY);
        }
    };

    Window_StatusMain.prototype.drawParametersSection = function(x, y) {
        const actor = this._actor;
        const width = this.innerWidth - x * 2;
        const height = 260;
        
        this.drawSectionBg(x, y, width, height);

        this.contents.fontSize = 22;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("角色属性", x + 10, y + 10, 200);
        
        const lineHeight = 34;
        const startY = y + 45;
        const colWidth = width / 2 - 10;
        const col2X = x + width / 2 + 10;

        for (let i = 0; i < 6; i++) {
            const paramId = 2 + i;
            const dy = startY + i * lineHeight;
            this.drawParamLine(x + 10, dy, colWidth, TextManager.param(paramId), actor.param(paramId));
        }

        const labelHit = TextManager.param(8) || "命中率";
        const labelEva = TextManager.param(9) || "闪避率";

        const exList = [
            { name: labelHit, value: Math.floor(actor.hit * 100) + "%" },
            { name: labelEva, value: Math.floor(actor.eva * 100) + "%" },
            { name: "暴击率", value: Math.floor(actor.cri * 100) + "%" },
            { name: "反击率", value: Math.floor(actor.cnt * 100) + "%" },
            { name: "魔法闪避", value: Math.floor(actor.mev * 100) + "%" },
            { name: "受击率", value: Math.floor(actor.tgr * 100) + "%" }
        ];

        for (let i = 0; i < 6; i++) {
            const dy = startY + i * lineHeight;
            this.drawParamLine(col2X, dy, colWidth, exList[i].name, exList[i].value);
        }
    };

    Window_StatusMain.prototype.drawParamLine = function(x, y, width, name, value) {
        this.changeTextColor(ColorManager.systemColor());
        this.contents.fontSize = 20;
        this.drawText(name, x, y, 100);
        
        this.resetTextColor();
        this.contents.fontSize = 22;
        this.drawText(value, x + width - 70, y, 60, "right");
        
        this.contents.fillRect(x, y + 30, width - 10, 1, "rgba(255,255,255,0.1)");
    };

    Window_StatusMain.prototype.drawEquipSection = function(x, y) {
        const width = this.innerWidth - x * 2;
        const height = this.innerHeight - y - 10;
        
        this.drawSectionBg(x, y, width, height);

        this.contents.fontSize = 22;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("装备列表", x + 10, y + 10, 200);

        const slots = this._actor.equipSlots();
        const equips = this._actor.equips();
        const lineHeight = 38;
        const startY = y + 45;

        for (let i = 0; i < slots.length; i++) {
            const dy = startY + i * lineHeight;
            if (dy + lineHeight > this.innerHeight) break;

            const slotName = $dataSystem.equipTypes[slots[i]];
            const item = equips[i];

            this.changeTextColor(ColorManager.systemColor());
            this.contents.fontSize = 20;
            this.drawText(slotName, x + 10, dy, 80);

            if (item) {
                this.drawIcon(item.iconIndex, x + 100, dy + 2);
                this.resetTextColor();
                this.drawText(item.name, x + 140, dy, 250);
            } else {
                this.changeTextColor(ColorManager.normalColor());
                this.contents.paintOpacity = 100;
                this.drawText("- 无 -", x + 140, dy, 250);
                this.contents.paintOpacity = 255;
            }
        }
    };

    Window_StatusMain.prototype.placeGauge = function(actor, type, x, y) {
        if (typeof Sprite_MenuGauge === "undefined") return;
        const key = "status-gauge-" + type;
        
        if (!this._gaugeSprites) this._gaugeSprites = {};
        
        let sprite = this._gaugeSprites[key];
        if (!sprite) {
            sprite = new Sprite_MenuGauge();
            this._gaugeSprites[key] = sprite;
            this.addInnerChild(sprite);
        }
        sprite.setup(actor, type);
        sprite.move(x, y);
        sprite.show();
    };
    
    const _Window_StatusMain_destroy = Window_StatusMain.prototype.destroy;
    Window_StatusMain.prototype.destroy = function(options) {
        if (this._gaugeSprites) {
            for (const key in this._gaugeSprites) {
                this._gaugeSprites[key].destroy();
            }
        }
        if (_Window_StatusMain_destroy) _Window_StatusMain_destroy.call(this, options);
    };

    // ========================================================================
    // [Module 6] 存档/商店界面适配
    // ========================================================================

    // --- 存档界面 ---
    Scene_File.prototype.helpWindowRect = function() {
        const wx = 0;
        const wy = 0; 
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, false);
        return new Rectangle(wx, wy, ww, wh);
    };
    Scene_File.prototype.listWindowRect = function() {
        const wx = 0;
        const helpRect = this.helpWindowRect();
        const wy = helpRect.height + helpRect.y; 
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy;
        return new Rectangle(wx, wy, ww, wh);
    };

    // ========================================================================
    // [Module 7] 物品界面重构 (Scene_Item)
    // ========================================================================

    const SQ_ITEM_CONFIG = {
        catH: 70,       
        helpH: 300,     
    };

    Scene_Item.prototype.categoryWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, SQ_ITEM_CONFIG.catH);
    };

    Scene_Item.prototype.itemWindowRect = function() {
        const wy = SQ_ITEM_CONFIG.catH; 
        const wh = Graphics.boxHeight - SQ_ITEM_CONFIG.catH - SQ_ITEM_CONFIG.helpH; 
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    Window_ItemList.prototype.maxCols = function() {
        return 2; 
    };
    
    Window_ItemList.prototype.spacing = function() {
        return 12;
    };

    function Window_ItemUserHelp() {
        this.initialize(...arguments);
    }
    Window_ItemUserHelp.prototype = Object.create(Window_Base.prototype);
    Window_ItemUserHelp.prototype.constructor = Window_ItemUserHelp;

    Window_ItemUserHelp.storyContentSize = 18;

    Window_ItemUserHelp.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
        this.padding = 12; 
        this.loadWindowskin(); 
        this.backOpacity = 255; 
        this.opacity = 255;
    };

    Window_ItemUserHelp.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem("Battlewindow");
    };

    Window_ItemUserHelp.prototype.resetFontSettings = function() {
        this.contents.fontFace = $gameSystem.mainFontFace();
        this.contents.fontSize = Window_ItemUserHelp.storyContentSize; 
        this.resetTextColor();
    };

    Window_ItemUserHelp.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    Window_ItemUserHelp.prototype.clear = function() {
        this.setItem(null);
    };

    Window_ItemUserHelp.prototype.refresh = function() {
        this.contents.clear();
        if (!this._item) return;

        let text = this._item.meta.itemStory;
        let isStory = true;

        if (!text) {
            text = this._item.description;
            isStory = false;
        }

        if (!text) return;

        this.resetFontSettings();

        if (isStory) {
            this.changeTextColor("#e6c510"); 
        } else {
            this.resetTextColor(); 
        }

        this.drawTextEx(text, 4, 4, this.contents.width - 8);
    };

    Scene_Item.prototype.createHelpWindow = function() {
        const wy = Graphics.boxHeight - SQ_ITEM_CONFIG.helpH;
        const rect = new Rectangle(0, wy, Graphics.boxWidth, SQ_ITEM_CONFIG.helpH);
        this._helpWindow = new Window_ItemUserHelp(rect);
        this.addWindow(this._helpWindow);
    };

    const _Window_ItemList_updateHelp = Window_ItemList.prototype.updateHelp;
    Window_ItemList.prototype.updateHelp = function() {
        if (SceneManager._scene instanceof Scene_Item && this._helpWindow) {
            this._helpWindow.setItem(this.item());
        } else {
            _Window_ItemList_updateHelp.call(this);
        }
    };

    // ========================================================================
    // [Module 8] 存档界面卡片化
    // ========================================================================

    const _DataManager_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function() {
        const info = _DataManager_makeSavefileInfo.call(this);
        info.mapName = $gameMap.displayName() || "未知地图"; 
        info.gold = $gameParty.gold();                       
        info.leaderLv = $gameParty.leader() ? $gameParty.leader().level : 1; 
        return info;
    };

    const SQ_SAVE_CONFIG = {
        itemHeight: 120,    
        faceSize: 96,       
        fontSize: {
            id: 26,         
            map: 20,        
            info: 18,       
        }
    };

    Window_SavefileList.prototype.itemHeight = function() {
        return SQ_SAVE_CONFIG.itemHeight;
    };

    Window_SavefileList.prototype.drawItem = function(index) {
        // 主动触发背景绘制以显示渐变光标
        this.drawItemBackground(index);

        const savefileId = this.indexToSavefileId(index);
        const info = DataManager.savefileInfo(savefileId);
        const rect = this.itemRectWithPadding(index);

        this.drawSaveCardBg(rect);

        if (!info) {
            this.drawEmptySlot(savefileId, rect);
            return;
        }

        this.drawScaledFace(info, rect);

        const contentX = rect.x + SQ_SAVE_CONFIG.faceSize + 16;
        const contentW = rect.width - contentX - 10;
        let curY = rect.y + 6;

        this.resetFontSettings();
        
        const idLabel = savefileId === 0 ? "【自动存档】" : `【存档 ${savefileId}】`;
        this.contents.fontSize = SQ_SAVE_CONFIG.fontSize.id;
        this.changeTextColor("#FFD700"); 
        this.drawText(idLabel, contentX, curY, 200);

        if (info.mapName) {
            this.contents.fontSize = SQ_SAVE_CONFIG.fontSize.map;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(info.mapName, contentX, curY + 2, contentW, "right");
        }

        curY += 36;

        this.contents.fontSize = SQ_SAVE_CONFIG.fontSize.info;
        this.resetTextColor();
        
        const lvText = `等级: ${info.leaderLv || '?'}`;
        this.drawText(lvText, contentX, curY, 100);

        const goldText = `银币: ${info.gold !== undefined ? info.gold : '?'}`;
        this.changeTextColor("#ffffa0"); 
        this.drawText(goldText, contentX + 110, curY, 150);
        
        curY += 28;

        this.resetTextColor();
        this.drawText(`时间: ${info.playtime}`, contentX, curY, 200);
        
        if (info.timestamp) {
            const date = new Date(info.timestamp);
            const dateStr = date.toLocaleDateString() + " " + date.getHours().toString().padStart(2,'0') + ":" + date.getMinutes().toString().padStart(2,'0');
            this.changeTextColor("rgba(255, 255, 255, 0.5)");
            this.contents.fontSize = 16;
            this.drawText(dateStr, contentX, curY + 2, contentW, "right");
        }
    };

    Window_SavefileList.prototype.drawSaveCardBg = function(rect) {
        const ctx = this.contents.context;
        const grd = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y);
        grd.addColorStop(0, "rgba(0, 0, 0, 0.6)");   
        grd.addColorStop(1, "rgba(0, 0, 0, 0.2)");   
        
        ctx.fillStyle = grd;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        this.contents.fillRect(rect.x, rect.y + rect.height - 1, rect.width, 1, "rgba(255, 255, 255, 0.2)");
    };

    Window_SavefileList.prototype.drawScaledFace = function(info, rect) {
        if (!info.faces || info.faces.length === 0) return;
        
        const faceName = info.faces[0][0];
        const faceIndex = info.faces[0][1];
        const targetSize = SQ_SAVE_CONFIG.faceSize; 
        
        const dy = rect.y + (rect.height - targetSize) / 2;
        const dx = rect.x + 8;

        const bitmap = ImageManager.loadFace(faceName);
        
        if (bitmap.isReady()) {
            const pw = ImageManager.faceWidth;  
            const ph = ImageManager.faceHeight;
            const sw = pw;
            const sh = ph;
            const sx = (faceIndex % 4) * pw;
            const sy = Math.floor(faceIndex / 4) * ph;

            this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy, targetSize, targetSize);
            this.contents.strokeRect(dx, dy, targetSize, targetSize, "rgba(255, 255, 255, 0.5)");
        } else {
            bitmap.addLoadListener(this.refresh.bind(this));
        }
    };

    Window_SavefileList.prototype.drawEmptySlot = function(id, rect) {
        const idLabel = id === 0 ? "自动存档" : `存档 ${id}`;
        
        this.resetFontSettings();
        this.contents.fontSize = SQ_SAVE_CONFIG.fontSize.id;
        this.changeTextColor("rgba(255, 255, 255, 0.4)");
        this.drawText(idLabel, rect.x + 16, rect.y + 10, 200);

        const midY = rect.y + rect.height / 2 - 12;
        this.contents.fontSize = 24;
        this.changeTextColor("rgba(255, 255, 255, 0.2)");
        this.drawText("- 空 白 存 档 -", rect.x, midY, rect.width, "center");
    };

    // ========================================================================
    // [Module 9] 样式补丁 (Style Patch)
    // ========================================================================
    const targetWindowClasses = [
        Window_Help, Window_Gold, Window_MenuCommand, Window_MenuStatus,
        Window_MenuActor, Window_ItemCategory, Window_ItemList,
        Window_SkillType, Window_SkillStatus, Window_SkillList, Window_SkillHelp,
        Window_EquipCommand, Window_EquipSlot, Window_EquipItem, Window_EquipStatus,
        Window_Status, Window_StatusParams, Window_StatusEquip,
        Window_Options, Window_SavefileList, Window_GameEnd,
        // 【新增】商店界面的核心窗口
        Window_ShopCommand, Window_ShopBuy, Window_ShopSell, Window_ShopStatus
    ];

    for (const WinClass of targetWindowClasses) {
        if (!WinClass) continue;
        WinClass.prototype.loadWindowskin = function() {
            this.windowskin = ImageManager.loadSystem("Battlewindow");
        };
        WinClass.prototype.updateBackOpacity = function() {
            this.backOpacity = 255;
        };
        const _alias_initialize = WinClass.prototype.initialize;
        WinClass.prototype.initialize = function(rect) {
            _alias_initialize.call(this, rect);
            this.backOpacity = 255; 
            this.opacity = 255;     
            if (this._dimmerSprite) this._dimmerSprite.visible = false;
        };
    }
    // ========================================================================
    // [Module 10] 视觉核心美化 v3.1 (Visual Polish - Soft Champagne Gold)
    // ------------------------------------------------------------------------
    // 1. 降低饱和度：将“亮黄色”改为“柔和香槟金/古铜金”。
    // 2. 降低亮度：减弱外发光和边框透明度，视觉更护眼。
    // ========================================================================

    // 1. 重写选中项背景绘制 (暗色基调 + 极淡的金色底纹)
    Window_Selectable.prototype.drawBackgroundRect = function(rect) {
        // 起始色：保持深褐色，增加一点透明度让画面更通透
        const c1 = "rgba(30, 15, 5, 0.5)"; 
        // 结束色：完全透明
        const c2 = "rgba(30, 15, 5, 0.0)";  
        
        const x = rect.x;
        const y = rect.y;
        const w = rect.width;
        const h = rect.height;

        // 绘制背景渐变
        this.contentsBack.gradientFillRect(x, y, w, h, c1, c2, false);
        
        // 底部装饰线：改为极淡的香槟金，不再刺眼 (透明度 0.3 -> 0.15)
        this.contentsBack.fillRect(x, y + h - 1, w, 1, "rgba(218, 194, 112, 0.15)");
    };

    // 2. 修正主菜单脸图边框 (更细、更淡)
    if (Window_MenuStatus) {
        Window_MenuStatus.prototype.drawSlotCardBg = function(index) {
            const p = this._tempParams;
            if (!p) return;
            const x = p.faceX;
            const y = p.faceY;
            const s = p.faceSize;

            // 仅绘制边框：改为柔和的古铜色，透明度大幅降低 (0.5 -> 0.25)
            // 这样既有界限感，又不会抢了头像的戏
            this.contents.strokeRect(x, y, s, s, "rgba(218, 194, 112, 0.25)"); 
        };
    }
    
    // 3. 装备界面脸图绘制 (背景置底，边框柔化)
    if (Window_EquipStatus) {
        Window_EquipStatus.prototype.drawFaceWithFrame = function() {
            const faceSize = (typeof SQ_EQUIP_CONFIG !== 'undefined') ? SQ_EQUIP_CONFIG.faceSize : 144;
            const faceY = Math.floor((this.innerHeight - faceSize) / 2);
            const faceX = 6; 
            
            // 背景底色：深色半透明
            this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.4)");
            
            // 绘制脸图
            this.drawActorFace(this._actor, faceX, faceY, faceSize, faceSize);
            
            // 边框：柔和香槟金 (0.3 透明度)
            this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(218, 194, 112, 0.3)"); 
        };
    }

    // 4. 重写光标刷新逻辑 (核心：去油腻，改用哑光金)
    Window.prototype._refreshCursor = function() {
        const pad = this._padding;
        const x = this._cursorRect.x + pad - this.origin.x;
        const y = this._cursorRect.y + pad - this.origin.y;
        const w = this._cursorRect.width;
        const h = this._cursorRect.height;
        const x2 = Math.max(x, pad);
        const y2 = Math.max(y, pad);
        const ox = x - x2;
        const oy = y - y2;
        const w2 = Math.min(w, this._width - pad * 2);
        const h2 = Math.min(h, this._height - pad * 2);

        const bitmap = new Bitmap(w2, h2);
        this._cursorSprite.bitmap = bitmap;
        this._cursorSprite.setFrame(0, 0, w2, h2);
        this._cursorSprite.move(x2, y2);

        if (w > 0 && h > 0) {
            const ctx = bitmap.context;
            
            // 1. 填充：几乎不可见的暖色光晕 (0.05 -> 0.03)
            ctx.fillStyle = "rgba(255, 230, 150, 0.03)";
            ctx.fillRect(ox, oy, w2, h2);

            // 2. 外发光：大幅减弱，颜色改为柔和的金褐色，不再是刺眼的橙色
            ctx.shadowBlur = 4; // 模糊半径减半 (8 -> 4)
            ctx.shadowColor = "rgba(184, 134, 11, 0.4)"; // 暗金
            
            // 3. 主边框：香槟金 (#DAC272)，哑光质感
            ctx.strokeStyle = "#DAC272"; 
            ctx.lineWidth = 1.5; // 线条变细一点点 (2 -> 1.5)
            
            // 绘制矩形边框
            ctx.strokeRect(ox + 1, oy + 1, w2 - 2, h2 - 2);
            
            // 4. 四角装饰：改为半透明白，不再是死白
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
            const cornerLen = 5;
            ctx.beginPath();
            // 左上
            ctx.moveTo(ox + 1, oy + cornerLen); ctx.lineTo(ox + 1, oy + 1); ctx.lineTo(ox + cornerLen, oy + 1);
            // 右上
            ctx.moveTo(w2 - cornerLen, oy + 1); ctx.lineTo(w2 - 1, oy + 1); ctx.lineTo(w2 - 1, oy + cornerLen);
            // 右下
            ctx.moveTo(w2 - 1, h2 - cornerLen); ctx.lineTo(w2 - 1, h2 - 1); ctx.lineTo(w2 - cornerLen, h2 - 1);
            // 左下
            ctx.moveTo(ox + cornerLen, h2 - 1); ctx.lineTo(ox + 1, h2 - 1); ctx.lineTo(ox + 1, h2 - cornerLen);
            ctx.stroke();
        }
        
        for (const child of this._cursorSprite.children) {
            child.visible = false;
        }
    };

    // 5. 呼吸动画 (修复版：非激活时隐藏)
    Window.prototype._makeCursorAlpha = function() {
        const baseAlpha = this.contentsOpacity / 255;
        
        if (this.active) {
            // 激活状态：保留你原本的呼吸效果
            // 速度减慢: 0.12 -> 0.08
            // 亮度区间: 0.6 ~ 0.9
            const pulse = (Math.sin(this._animationCount * 0.08) + 1) / 2; 
            return baseAlpha * (0.6 + pulse * 0.3);
        }
        
        // 【核心修复点】
        // 非激活状态：直接返回 0 (完全透明/隐藏)
        // 这样当焦点跳到其他窗口时，残留的金色边框就会立刻消失
        return 0; 
    };

    // 6. 修正 ContentsBack 清理
    const _Window_Selectable_refresh = Window_Selectable.prototype.refresh;
    Window_Selectable.prototype.refresh = function() {
        if (this.contentsBack) {
            this.contentsBack.clear();
        }
        _Window_Selectable_refresh.call(this);
    };
// ========================================================================
    // [Module 11] 商店界面完整重构 (Scene_Shop Complete Refactor)
    // 模式：纯净描述版 (Text Description Mode)
    // ========================================================================

    const SQ_SHOP_CONFIG = {
        cmdHeight: 70,      // 顶部指令窗口高度
        goldWidth: 160,     // 金币窗口宽度
        statusHeight: 290,  // 底部状态窗口高度 (保持较高，方便显示长描述)
        fontSize: 22        // 商店列表基础字号
    };

    // ------------------------------------------------------------------------
    // 1. 窗口位置布局 (Layout Rects)
    // ------------------------------------------------------------------------

    // 指令窗口 (左上)
    Scene_Shop.prototype.commandWindowRect = function() {
        const wx = 0;
        const wy = 0; // 强制顶格
        const ww = Graphics.boxWidth - SQ_SHOP_CONFIG.goldWidth;
        const wh = SQ_SHOP_CONFIG.cmdHeight;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 金币窗口 (右上)
    Scene_Shop.prototype.goldWindowRect = function() {
        const ww = SQ_SHOP_CONFIG.goldWidth;
        const wh = SQ_SHOP_CONFIG.cmdHeight;
        const wx = Graphics.boxWidth - ww;
        const wy = 0; // 强制顶格
        return new Rectangle(wx, wy, ww, wh);
    };

    // 占位/背景窗口
    Scene_Shop.prototype.dummyWindowRect = function() {
        const wx = 0;
        const wy = SQ_SHOP_CONFIG.cmdHeight;
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 分类窗口
    Scene_Shop.prototype.categoryWindowRect = function() {
        const wx = 0;
        const wy = SQ_SHOP_CONFIG.cmdHeight;
        const ww = Graphics.boxWidth;
        const wh = SQ_SHOP_CONFIG.cmdHeight;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 状态窗口 (底部固定 290px)
    Scene_Shop.prototype.statusWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = SQ_SHOP_CONFIG.statusHeight;
        const wx = 0;
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 购买列表
    Scene_Shop.prototype.buyWindowRect = function() {
        const wx = 0;
        const wy = SQ_SHOP_CONFIG.cmdHeight;
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy - SQ_SHOP_CONFIG.statusHeight;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 出售列表
    Scene_Shop.prototype.sellWindowRect = function() {
        const wx = 0;
        const wy = SQ_SHOP_CONFIG.cmdHeight * 2;
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy - SQ_SHOP_CONFIG.statusHeight;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 数字输入窗口
    Scene_Shop.prototype.numberWindowRect = function() {
        const ww = 300;
        const wh = this.calcWindowHeight(3, false);
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2 - 100;
        return new Rectangle(wx, wy, ww, wh);
    };

    // ------------------------------------------------------------------------
    // 2. 样式美化 (Shop Styling)
    // ------------------------------------------------------------------------

    Window_ShopBuy.prototype.maxCols = function() { return 1; };
    Window_ShopSell.prototype.maxCols = function() { return 1; };
    Window_ShopCommand.prototype.itemTextAlign = function() { return "center"; };

    // 绘制列表项
    Window_ShopBuy.prototype.drawItem = function(index) {
        const item = this.itemAt(index);
        const price = this.price(item);
        const rect = this.itemLineRect(index);
        const priceWidth = this.priceWidth();
        const priceX = rect.x + rect.width - priceWidth;
        const nameWidth = rect.width - priceWidth;

        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item, rect.x, rect.y, nameWidth);
        this.contents.fontSize = SQ_SHOP_CONFIG.fontSize;
        this.changeTextColor("#FFD700"); 
        this.drawText(price, priceX, rect.y, priceWidth, "right");
        this.changePaintOpacity(true);
    };

    // 金币窗口刷新
    const _Window_Gold_refresh_shop = Window_Gold.prototype.refresh;
    Window_Gold.prototype.refresh = function() {
        if (SceneManager._scene instanceof Scene_Shop) {
             const rect = this.itemLineRect(0);
             this.contents.clear();
             this.contents.fontSize = 22;
             this.changeTextColor(ColorManager.systemColor());
             this.drawCurrencyValue(this.value(), this.currencyUnit(), rect.x, rect.y, rect.width);
             this.resetFontSettings();
        } else {
            _Window_Gold_refresh_shop.call(this);
        }
    };

    // ------------------------------------------------------------------------
    // 3. 状态窗口内容 (Text Description Logic)
    // ------------------------------------------------------------------------

    // 覆盖刷新逻辑：统一显示文字
    Window_ShopStatus.prototype.refresh = function() {
        this.contents.clear();
        
        // 无论有没有物品，都先画出框架，保证视觉不塌陷
        const x = this.itemPadding();
        const width = this.innerWidth - x * 2;
        
        // 1. 始终绘制分割线
        this.drawRect(x, 40, width, 2); 

        if (this._item) {
            // --- 有物品时的显示逻辑 ---
            
            // 顶部：持有数
            this.drawShopPossession(x, 0, width);
            
            // 内容区：统一显示文本描述/故事
            this.drawShopItemDesc(x, 50, width);
            
        } else {
            // --- 没有选中物品时的显示逻辑 ---
            
            // 顶部：显示空的持有数 (视觉占位)
            this.drawEmptyPossession(x, 0, width);
            
            // 内容区：显示提示文本
            this.drawEmptyStateHint(x, 50, width);
        }
    };

    // 绘制持有数
    Window_ShopStatus.prototype.drawShopPossession = function(x, y, width) {
        this.resetFontSettings();
        this.contents.fontSize = 24;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.possession, x, y, width);
        this.resetTextColor();
        const num = $gameParty.numItems(this._item);
        this.drawText(num, x, y, width, "right");
    };

    // 绘制物品/装备描述
    Window_ShopStatus.prototype.drawShopItemDesc = function(x, y, width) {
        // 读取优先级：装备故事 > 物品故事 > 默认说明
        let text = this._item.meta.equipStory || this._item.meta.itemStory || this._item.description;
        
        if (text) {
            this.resetFontSettings();
            this.contents.fontSize = 22; // 设置一个舒适的阅读字号
            
            // 如果是 Story (小作文)，用金色显示；普通说明用默认白色
            const isStory = this._item.meta.equipStory || this._item.meta.itemStory;
            this.changeTextColor(isStory ? "#FFD700" : "#ffffff");
            
            // 绘制文本 (支持 \n 换行 和 \C[n] 颜色代码)
            this.drawTextEx(text, x, y, width);
        }
    };

    // [Fix Integration] 补全缺失的装备列表绘制函数
    // 即使在文本模式下，保留此函数以防其他逻辑调用导致报错
    Window_ShopStatus.prototype.drawEquipActorList = function(x, y, width) {
        const members = this.statusMembers(); // 获取当前页队友
        const lineHeight = this.lineHeight();
        
        // 遍历队友并在底部窗口绘制装备能力对比
        for (let i = 0; i < members.length; i++) {
            // 动态计算Y坐标：使用 1.6 倍行高，让排版更紧凑，适配竖屏底部空间
            const actorY = y + Math.floor(lineHeight * i * 1.6);
            
            // 调用单人绘制函数
            this.drawActorEquipInfo(x, actorY, members[i]);
        }
    };

    // ------------------------------------------------------------------------
    // 4. 系统位置修复 (Core Fix)
    // ------------------------------------------------------------------------
    Scene_Shop.prototype.createCommandWindow = function() {
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_ShopCommand(rect);
        this._commandWindow.setPurchaseOnly(this._purchaseOnly);
        this._commandWindow.y = rect.y; // 强制使用 rect.y
        this._commandWindow.setHandler("buy", this.commandBuy.bind(this));
        this._commandWindow.setHandler("sell", this.commandSell.bind(this));
        this._commandWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    };
    // ========================================================================
    // [Module 12] 商店数量输入窗口修复 (Shop Number Input Fix)
    // 目标：修正OK按钮显示不全问题 (适配宽按钮布局)
    // ========================================================================

    // 1. 调整窗口大小和位置 (加宽以容纳 OK 长按钮)
    Scene_Shop.prototype.numberWindowRect = function() {
        const ww = 380; // 【修改】宽度增加到 380
        // 高度 = 4行文字区域 + 底部按钮区域 + 留白
        const wh = this.calcWindowHeight(4, false) + 60; 
        const wx = (Graphics.boxWidth - ww) / 2;
        // 稍微向上偏移一点，避免被手指遮挡
        const wy = (Graphics.boxHeight - wh) / 2 - 50; 
        return new Rectangle(wx, wy, ww, wh);
    };

    // 2. 重写初始化
    const _Window_ShopNumber_initialize = Window_ShopNumber.prototype.initialize;
    Window_ShopNumber.prototype.initialize = function(rect) {
        _Window_ShopNumber_initialize.call(this, rect);
        
        // 加载 Battlewindow 皮肤
        this.loadWindowskin(); 
        
        // 开启不透明度，显示窗口背景
        this.opacity = 255; 
        this.backOpacity = 255; 
        
        this.createButtons(); 
    };

    Window_ShopNumber.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem("Battlewindow");
    };

    // 3. 重写刷新逻辑
    Window_ShopNumber.prototype.refresh = function() {
        Window_Selectable.prototype.refresh.call(this);
        
        // 绘制商品信息
        this.drawCurrentItemName();
        this.drawMultiplicationSign();
        this.drawNumber();
        this.drawHorzLine(); 
        this.drawTotalPrice();
        
        // 刷新按钮位置
        this.placeButtons();
    };

    // 4. 创建按钮 (修改版：隐藏 +/- 10 按钮)
    Window_ShopNumber.prototype.createButtons = function() {
        if (this._buttons) {
            this._buttons.forEach(btn => {
                if (btn.parent === this._clientArea) {
                    this._clientArea.removeChild(btn);
                }
            });
        }
        this._buttons = [];
        
        // 【修改点】数组中删除了 "down2" 和 "up2"，只保留 减、加、OK
        const types = ["down", "up", "ok"];
        
        for (const type of types) {
            const button = new Sprite_Button(type);
            this._buttons.push(button);
            this.addInnerChild(button);
        }
        
        // 【修改点】重新绑定按键索引
        // 索引 0 是 down (减1)
        this._buttons[0].setClickHandler(this.onButtonDown.bind(this));
        // 索引 1 是 up (加1)
        this._buttons[1].setClickHandler(this.onButtonUp.bind(this));
        // 索引 2 是 ok (确认)
        this._buttons[2].setClickHandler(this.onButtonOk.bind(this));
    };
    // 5. 【核心修复】按钮智能布局算法
    Window_ShopNumber.prototype.placeButtons = function() {
        const spacing = 8; // 按钮间距稍微调小一点，更紧凑
        let totalWidth = 0;

        // 第一步：计算所有按钮加起来的实际总宽度
        // (因为 OK 键是 96px，其他是 48px，不能直接乘)
        for (const button of this._buttons) {
            totalWidth += button.width;
        }
        // 加上间距的总宽度
        totalWidth += (this._buttons.length - 1) * spacing;

        // 第二步：计算起始 X 坐标 (居中)
        let currentX = (this.innerWidth - totalWidth) / 2;
        
        // Y坐标：贴近窗口底部
        // 按钮高度通常是 48，留出底部 padding
        const buttonY = this.innerHeight - 48 - 6; 

        // 第三步：放置按钮
        for (const button of this._buttons) {
            button.x = currentX;
            button.y = buttonY;
            button.visible = true; 
            
            // 下一个按钮的 X 坐标 = 当前X + 当前按钮宽 + 间距
            currentX += button.width + spacing;
        }
    };

    // 6. 调整文字内容的纵向布局
    
    // 物品名 (第1行)
    Window_ShopNumber.prototype.itemNameY = function() { 
        return 12; 
    };
    
    // 乘号和数量 (第1行)
    Window_ShopNumber.prototype.multiplicationSignY = function() { 
        return this.itemNameY(); 
    };
    
    // 绘制乘号
    Window_ShopNumber.prototype.drawMultiplicationSign = function() {
        const sign = "\u00d7";
        const width = this.textWidth(sign);
        const x = this.cursorX() - width * 2;
        const y = this.itemNameY(); 
        this.resetTextColor();
        this.drawText(sign, x, y, width);
    };
    
    // 绘制数量
    Window_ShopNumber.prototype.drawNumber = function() {
        const x = this.cursorX();
        const y = this.itemNameY();
        const width = this.cursorWidth() - this.itemPadding();
        this.resetTextColor();
        this.contents.fontSize = 28; 
        this.changeTextColor("#00FF00"); 
        this.drawText(this._number, x, y, width, "right");
        this.resetFontSettings();
    };

    // 分割线 (第2行)
    Window_ShopNumber.prototype.drawHorzLine = function() {
        const padding = this.itemPadding();
        const y = this.itemNameY() + this.lineHeight() + 10;
        const width = this.innerWidth - padding * 2;
        
        this.contents.fillRect(padding, y, width, 2, "rgba(255, 255, 255, 0.3)");
    };

    // 总价 (第3行)
    Window_ShopNumber.prototype.totalPriceY = function() {
        return this.itemNameY() + this.lineHeight() + 24;
    };
    // ========================================================================
    // [Module 13] 商店悬浮弹窗交互与层级修复 (Shop Overlay & Z-Index Fix)
    // 目标：
    // 1. 点击购买时不隐藏列表
    // 2. 修复层级，确保弹窗在最上层
    // 3. 背景变暗聚焦
    // ========================================================================

    // ------------------------------------------------------------------------
    // 1. 层级修复 (Z-Index Fix)
    // ------------------------------------------------------------------------
    const _Scene_Shop_create = Scene_Shop.prototype.create;
    Scene_Shop.prototype.create = function() {
        // 先运行原版创建流程（生成所有窗口）
        _Scene_Shop_create.call(this);
        
        // 【核心修复】将数量窗口(_numberWindow) 移动到窗口层的最顶端
        // 因为原版它是先创建的，如果不移到最后，会被后创建的列表窗口挡住
        if (this._numberWindow) {
            this._windowLayer.removeChild(this._numberWindow);
            this._windowLayer.addChild(this._numberWindow);
        }
    };

    // ------------------------------------------------------------------------
    // 2. 交互逻辑重写 (不再隐藏列表)
    // ------------------------------------------------------------------------
    
    // 点击“购买”确认时
    Scene_Shop.prototype.onBuyOk = function() {
        this._item = this._buyWindow.item();
        
        // 【关键】删除了原版的 this._buyWindow.hide();
        // 列表保持显示，但失去焦点
        
        this._numberWindow.setup(this._item, this.maxBuy(), this.buyingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
    };

    // 点击“出售”确认时
    Scene_Shop.prototype.onSellOk = function() {
        this._item = this._sellWindow.item();
        
        // 【关键】删除了原版的 this._categoryWindow.hide() 和 this._sellWindow.hide();
        // 保持出售列表可见
        
        this._numberWindow.setup(this._item, this.maxSell(), this.sellingPrice());
        this._numberWindow.setCurrencyUnit(this.currencyUnit());
        this._numberWindow.show();
        this._numberWindow.activate();
        
        this._statusWindow.setItem(this._item);
        this._statusWindow.show();
    };

    // 取消数量选择时 (恢复列表状态)
    const _Scene_Shop_onNumberCancel = Scene_Shop.prototype.onNumberCancel;
    Scene_Shop.prototype.onNumberCancel = function() {
        SoundManager.playCancel();
        this._numberWindow.hide();
        
        // 恢复列表窗口的透明度
        this._buyWindow.alpha = 1;
        this._sellWindow.alpha = 1;
        this._statusWindow.alpha = 1;
        this._dummyWindow.alpha = 1;

        switch (this._commandWindow.currentSymbol()) {
            case "buy":
                this._buyWindow.activate();
                break;
            case "sell":
                this._sellWindow.activate();
                this._statusWindow.setItem(null);
                this._helpWindow.clear();
                break;
        }
    };

    // ------------------------------------------------------------------------
    // 3. 视觉聚焦 (Dim Background)
    // ------------------------------------------------------------------------
    
    const _Scene_Shop_update = Scene_Shop.prototype.update;
    Scene_Shop.prototype.update = function() {
        _Scene_Shop_update.call(this);
        
        // 当数量窗口激活（显示）时，让其他窗口变暗，形成遮罩效果
        if (this._numberWindow && this._numberWindow.visible) {
            const dimAlpha = 0.4; // 背景变暗程度 (0~1)
            
            this._buyWindow.alpha = dimAlpha;
            this._sellWindow.alpha = dimAlpha;
            this._statusWindow.alpha = dimAlpha;
            this._dummyWindow.alpha = dimAlpha;
            this._goldWindow.alpha = dimAlpha;
            this._commandWindow.alpha = dimAlpha;
            
            // 确保数量窗口自己是全亮的
            this._numberWindow.alpha = 1;
        } else {
            // 恢复全亮（为了防止残留，在update里持续检测比较稳妥）
            this._buyWindow.alpha = 1;
            this._sellWindow.alpha = 1;
            this._statusWindow.alpha = 1;
            this._dummyWindow.alpha = 1;
            this._goldWindow.alpha = 1;
            this._commandWindow.alpha = 1;
        }
    };
    // ========================================================================
    // [Module 14] 出售界面统一 (Unified Sell Interface)
    // 目标：使出售界面的底部信息显示与购买界面一致（大窗口+详细描述）
    // ========================================================================

    // 1. 劫持 createSellWindow，隐藏原版 helpWindow 并关联 statusWindow
    const _Scene_Shop_createSellWindow = Scene_Shop.prototype.createSellWindow;
    Scene_Shop.prototype.createSellWindow = function() {
        _Scene_Shop_createSellWindow.call(this);
        
        // 关键步骤：把出售列表关联到底部的大状态窗口，而不是顶部的帮助窗口
        if (this._sellWindow) {
            this._sellWindow.setStatusWindow(this._statusWindow);
            
            // 覆盖原版的 setHelpWindow，防止它去更新那个我们要隐藏的小窗口
            // 这样 _sellWindow 就只会更新 _statusWindow 了
            this._sellWindow.setHelpWindow(null); 
        }
    };

    // 2. 劫持 commandSell，点击“出售”时切换界面状态
    const _Scene_Shop_commandSell = Scene_Shop.prototype.commandSell;
    Scene_Shop.prototype.commandSell = function() {
        _Scene_Shop_commandSell.call(this);
        
        // 隐藏原版顶部帮助窗口
        if (this._helpWindow) {
            this._helpWindow.hide();
        }
        
        // 显示并清空底部大窗口
        if (this._statusWindow) {
            this._statusWindow.show();
            this._statusWindow.setItem(null);
        }
        
        // 强制刷新出售列表，确保第一次选中项能更新底部窗口
        this._sellWindow.refresh();
        this._sellWindow.select(0); // 选中第一项，触发 updateHelp
    };

    // 3. 劫持 onCategoryCancel，退出出售模式时恢复状态
    const _Scene_Shop_onCategoryCancel = Scene_Shop.prototype.onCategoryCancel;
    Scene_Shop.prototype.onCategoryCancel = function() {
        _Scene_Shop_onCategoryCancel.call(this);
        
        // 隐藏底部大窗口
        if (this._statusWindow) {
            this._statusWindow.hide();
        }
        
        // 恢复原版帮助窗口（如果其他界面需要用到的话）
        // 但在这个重构里，我们几乎全程都不用原版帮助窗口了，所以这步可选
    };

    // 4. 给 Window_ShopSell 添加 setStatusWindow 方法
    // 因为原版 Window_ShopSell 没有这个方法，我们要补上
    Window_ShopSell.prototype.setStatusWindow = function(statusWindow) {
        this._statusWindow = statusWindow;
        this.callUpdateHelp();
    };

    // 5. 重写 Window_ShopSell 的 updateHelp
    // 让它去更新 statusWindow 而不是 helpWindow
    Window_ShopSell.prototype.updateHelp = function() {
        // 原版是 this._helpWindow.setItem(item);
        // 我们改为：
        if (this._statusWindow) {
            this._statusWindow.setItem(this.item());
        }
    };

    // [Fix Integration] 修复商店出售模式下底部窗口消失的问题
    // logic: 修正 activateSellWindow 中的显示逻辑，强制显示 StatusWindow
    Scene_Shop.prototype.activateSellWindow = function() {
        // 1. 如果有分类窗口且需要选择，保持显示
        if (this._categoryWindow.needsSelection()) {
            this._categoryWindow.show();
        }
        
        // 2. 刷新并激活出售列表
        this._sellWindow.refresh();
        this._sellWindow.show();
        this._sellWindow.activate();
        
        // 3. 【核心修复】这里原版逻辑是 hide()，现强制改为 show()
        // 配合 Module 14 的逻辑，确保出售时也能看到底部的大状态窗口
        if (this._statusWindow) {
            this._statusWindow.show();
            this._statusWindow.open(); // 确保它是打开状态
            
            // 4. 立即同步一次当前选中的物品信息
            // 防止刚进入时显示为空或显示上一次残留的信息
            const item = this._sellWindow.item();
            this._statusWindow.setItem(item);
        }
    };

    // ========================================================================
    // [Module 15] 商店状态窗口空状态修复 (Shop Status Empty State Fix)
    // 目标：解决选中分类或未选中物品时，下方窗口内容消失的问题
    // ========================================================================

    // 辅助：绘制空状态下的持有数栏
    Window_ShopStatus.prototype.drawEmptyPossession = function(x, y, width) {
        this.resetFontSettings();
        this.contents.fontSize = 24;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.possession, x, y, width);
        
        this.resetTextColor();
        this.changeTextColor("rgba(255, 255, 255, 0.5)"); // 灰色
        this.drawText("-", x, y, width, "right");
    };

    // 辅助：绘制空状态提示语
    Window_ShopStatus.prototype.drawEmptyStateHint = function(x, y, width) {
        const text = "请选择要操作的物品...";
        
        this.resetFontSettings();
        this.contents.fontSize = 22;
        this.changeTextColor("rgba(255, 255, 255, 0.4)"); // 半透明灰色
        
        // 垂直居中显示提示
        const centerY = y + (this.innerHeight - y) / 2 - 20;
        this.drawText(text, x, y, width, "center");
    };
    
    // 2. 修复分类窗口逻辑，确保切换分类时底部窗口能收到“空”信号
    const _Window_ItemCategory_update_fix = Window_ItemCategory.prototype.update;
    Window_ItemCategory.prototype.update = function() {
        _Window_ItemCategory_update_fix.call(this);
        
        if (this.active && this._itemWindow) {
            const item = this._itemWindow.item();
            // 只要是在分类选择状态，且没有选中具体物品，就强制刷新底部为 null
            // 这样就能触发上面的 drawEmptyStateHint
            if (this._itemWindow._statusWindow) {
                this._itemWindow._statusWindow.setItem(item);
            }
        }
    };
    // ========================================================================
    // [Module 16] 商店背景窗口皮肤修复 (Shop Dummy Window Fix)
    // ========================================================================
    const _Scene_Shop_createDummyWindow = Scene_Shop.prototype.createDummyWindow;
    Scene_Shop.prototype.createDummyWindow = function() {
        // 在创建占位窗口前，临时劫持 Window_Base 的 loadWindowskin
        const tempLoadWindowskin = Window_Base.prototype.loadWindowskin;
        Window_Base.prototype.loadWindowskin = function() {
            this.windowskin = ImageManager.loadSystem("Battlewindow");
        };

        _Scene_Shop_createDummyWindow.call(this);

        // 创建完成后恢复原状，以免影响游戏中其他普通窗口
        Window_Base.prototype.loadWindowskin = tempLoadWindowskin;
        
        // 确保不透明度和背景设置正确
        if (this._dummyWindow) {
            this._dummyWindow.opacity = 255;
            this._dummyWindow.backOpacity = 255;
            // 移除可能存在的渐变背景精灵，确保样式统一
            if (this._dummyWindow._dimmerSprite) {
                this._dummyWindow._dimmerSprite.visible = false;
            }
        }
    };
})();