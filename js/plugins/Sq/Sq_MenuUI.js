/*:
 * @target MZ
 * @plugindesc [彩虹城堡] UI核心融合版 - (J2ME竖屏复刻专用)
 * @author 神枪手 & Gemini融合优化
 *
 * @param enableLoadCommand
 * @text 启用菜单读档功能
 * @type boolean
 * @default true
 * @desc 是否在菜单中添加读档选项。true=启用，false=禁用。
 *
 * @help
 * ============================================================================
 * 说明
 * ============================================================================
 * 本插件是专为 J2ME 风格重制版（480x854竖屏）定制的 UI 核心。
 * 已融合 UI 美化补丁，实现了高亮文字、卡片背景及荧光计量槽。
 *
 * 主要功能：
 * 1. 主菜单美化：头像框紧贴(144x144)，计量槽适配不超屏。
 * 2. 二级菜单重构：适配竖屏的技能、装备、状态、商店、存档界面。
 * 3. 菜单读档：可选开启。
 * 4. J2ME 风格：强制不透明窗口背景，统一使用 Battlewindow 皮肤。
 *
 * ============================================================================
 * 图片资源需求 (img/pictures/)
 * ============================================================================
 * - Menu.png    (全局菜单背景，必需！尺寸建议 480x854)
 * - hpicon.png, mpicon.png, tpicon.png (计量槽左侧小图标)
 * - lvicon.png  (等级图标)
 *
 * ============================================================================
 * 系统资源需求 (img/system/)
 * ============================================================================
 * - Battlewindow.png (窗口皮肤，建议使用 J2ME 风格的样式)
 *
 */

(() => {
    'use strict';

    const pluginParams = PluginManager.parameters('Sq_MenuUI');
    const enableLoadCommand = pluginParams.enableLoadCommand === 'true';

    // ========================================================================
    // 资源加载 (合并 Scene_Boot)
    // ========================================================================
    const _Scene_Boot_loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {
        _Scene_Boot_loadSystemImages.call(this);
        ColorManager.loadWindowskin();
        ImageManager.loadSystem("IconSet");
        
        // 加载 UI 必须的图片资源
        ImageManager.loadPicture("hpicon");
        ImageManager.loadPicture("mpicon");
        ImageManager.loadPicture("tpicon");
        ImageManager.loadPicture("lvicon");
        
        // 预加载全局背景
        ImageManager.loadPicture("Menu");
        
        // 预加载 J2ME 风格皮肤
        ImageManager.loadSystem("Battlewindow");
    };

    // ========================================================================
    // 核心组件：Sprite_MenuGauge (荧光风格)
    // ========================================================================
    class Sprite_MenuGauge extends Sprite_Gauge {
        constructor() {
            super();
        }

        // 【关键修改】宽度适配
        // 右侧窗口宽 340 - 头像 144 - 边距 ≈ 剩余 160
        // 设置为 155 保证绝对不超屏
        bitmapWidth() { return 145; } 
        bitmapHeight() { return 32; }
        gaugeHeight() { return 14; } // 保持一定厚度

        gaugeBackColor() { return "#202020"; }

        gaugeColor1() {
            switch (this._statusType) {
                case "hp": return "#ff6b6b"; // 红
                case "mp": return "#4d96ff"; // 蓝
                case "tp": return "#6bc547"; // 绿
                default: return "#ffffff";
            }
        }

        gaugeColor2() {
            switch (this._statusType) {
                case "hp": return "#ff9f43"; // 橙
                case "mp": return "#54a0ff"; // 浅蓝
                case "tp": return "#95d5b2"; // 浅绿
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
            const iconY = 12; // 图标垂直居中微调
            const iconSize = 12; 
            
            const drawIcon = () => {
                this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
            };

            if (bitmap.width > 0) {
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
            
            // 当前值 
            this.bitmap.textColor = "rgba(255, 255, 255, 1)";
            this.bitmap.fontSize = 18; 
            this.bitmap.drawText(currentValue, 0, -4, width - maxValueWidth + 2, height, "right");
            
            // /最大值
            this.bitmap.textColor = "rgba(255, 255, 255, 0.7)";
            this.bitmap.fontSize = 12;
            this.bitmap.drawText(`/${currentMaxValue}`, width - maxValueWidth, -2, maxValueWidth, height, "right");
        }
    }
    window.Sprite_MenuGauge = Sprite_MenuGauge;

    // ========================================================================
    // 模块 1：通用背景与主菜单界面 (Scene_Menu)
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
        // 状态窗口占据右侧
        const ww = 340; // 480 - 140
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
    // 主菜单状态绘制逻辑 (重写核心：紧贴边框与防溢出)
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

    // 覆盖 drawItem：计算布局参数
    Window_MenuStatus.prototype.drawItem = function(index) {
        const rect = this.itemRect(index);
        const faceSize = 144; 
        
        // 垂直居中计算
        const offsetY = Math.floor((rect.height - faceSize) / 2); 

        // 临时存储坐标参数
        this._tempParams = { 
            faceSize: faceSize,
            offsetY: offsetY,
            faceX: rect.x + 4, // 稍微靠左，留出更多空间给右侧
            faceY: rect.y + offsetY
        };

        this.drawPendingItemBackground(index);
        this.drawItemImage(index);   // 先画头像
        this.drawSlotCardBg(index);  // 后画边框(盖在头像边缘，遮瑕)
        this.drawItemStatus(index);  // 画文字和槽
    };

    // 绘制头像
    Window_MenuStatus.prototype.drawItemImage = function(index) {
        const actor = this.actor(index);
        const p = this._tempParams;
        if (!actor || !p) return;
        
        // 直接在计算好的位置绘制头像，无偏移
        this.drawActorFace(actor, p.faceX, p.faceY, p.faceSize, p.faceSize);
    };

    // 【关键修改】绘制紧贴头像的边框
    Window_MenuStatus.prototype.drawSlotCardBg = function(index) {
        const p = this._tempParams;
        if (!p) return;
        const x = p.faceX;
        const y = p.faceY;
        const s = p.faceSize; // 144

        // 绘制紧贴的外框 (往外扩1像素，制造包裹感，不遮挡头像内容)
        // 金色主框
        this.contents.strokeRect(x, y, s, s, "rgba(255, 215, 0, 0.8)"); 
        
        // 外部阴影框 (让头像稍微立体一点)
        this.contents.strokeRect(x - 1, y - 1, s + 2, s + 2, "rgba(0, 0, 0, 0.5)"); 
    };

    // 绘制右侧信息 (坐标重新适配，防止超屏)
    Window_MenuStatus.prototype.drawItemStatus = function(index) {
        const actor = this.actor(index);
        const p = this._tempParams;
        if (!actor || !p) return;
        
        // --- 坐标定义 ---
        // dataX: 头像框右侧 + 10像素间距
        const dataX = p.faceX + p.faceSize + 10; 
        
        // 基础 Y 坐标：与头像顶部对齐
        const startY = p.faceY; 

        // --- 1. 名字 (Row 1) ---
        this.contents.fontSize = 26; 
        this.contents.fontBold = true; 
        this.changeTextColor('#FFD700'); // 金色
        this.drawText(actor.name(), dataX, startY, 150);
        this.contents.fontBold = false; 

        // --- 2. 等级与职业 (Row 2) ---
        // 名字下方
        const row2Y = startY + 32;
        
        // (A) 等级图标
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconX = dataX;
        const lvIconY = row2Y + 12; 
        
        const drawLvStuff = () => {
            // 绘制图标
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, lvIconX, lvIconY);
            
            // (B) 等级数字 (紧跟图标)
            // 假设图标宽约20-24，数字紧跟其后
            const numX = lvIconX + 24; 
            this.resetTextColor();
            this.contents.fontSize = 20;
            this.changeTextColor('#00FFFF'); // 青色
            this.drawText(actor.level, numX, row2Y + 2, 40);

            // (C) 职业名称 (紧跟等级数字)
            // 根据等级数字宽度估算偏移
            const classX = numX + 36; 
            this.contents.fontSize = 16;
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); // 浅灰色
            this.drawText(actor.currentClass().name, classX, row2Y + 4, 100);
        };

        if (lvIcon.width > 0) drawLvStuff(); else lvIcon.addLoadListener(drawLvStuff);

        // --- 3. 计量槽 (Row 3 & 4) ---
        // 放在职业下方
        let gaugeY = row2Y + 34;
        const gaugeSpacing = 32; // 槽间距

        // 这里传递给 placeGauge 的位置，计量槽宽度已被 Sprite_MenuGauge 限制为 155
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
    // 模块 2：读档命令注入
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
    // 模块 3：二级菜单重构 (窄类型窗口 + 宽状态窗口 + 6行列表 + 长故事)
    // ========================================================================

    // --- 角色选择窗口 (技能/物品用) ---
    Window_MenuActor.prototype.initialize = function(rect) {
        rect.x = 0;
        rect.y = 0;
        rect.width = 400;
        rect.height = Graphics.boxHeight - 120; 
        Window_MenuStatus.prototype.initialize.call(this, rect);
        this.hide();
    };

    // --- 技能列表 (Window_SkillList) ---
    const _original_Window_SkillList_initialize = Window_SkillList.prototype.initialize;
    Window_SkillList.prototype.initialize = function(rect) {
        if (SceneManager._scene instanceof Scene_Skill) {
            rect.x = 0;        
            rect.y = 180; // 紧接上方窗口
            rect.width = 480;
            
            // 高度固定为显示 6 行
            // 计算公式：(行高 36 * 6行) + (内边距 12*2) = 240
            rect.height = 240; 
            
            Window_Selectable.prototype.initialize.call(this, rect);
            this._actor = null;
            this._stypeId = 0;
            this._data = [];
        } else {
            _original_Window_SkillList_initialize.call(this, rect);
        }
    };

    // --- 技能类型 (Window_SkillType) ---
    Window_SkillType.prototype.initialize = function(rect) {
        // 【修改点】宽度变小，X坐标右移
        const typeWidth = 110; // 设置为 110 足够显示 "魔法"
        
        rect.width = typeWidth;    
        rect.x = Graphics.boxWidth - typeWidth; // 480 - 110 = 370
        rect.y = 0;         
        rect.height = 180;   
        Window_Command.prototype.initialize.call(this, rect);
        this._actor = null;
    };

    // --- 技能状态头 (Window_SkillStatus) ---
    Window_SkillStatus.prototype.initialize = function(rect) {
        // 【修改点】宽度自动填满左侧剩余空间
        const typeWidth = 110; // 对应上面的宽度

        rect.x = 0;                
        rect.y = 0;               
        rect.width = Graphics.boxWidth - typeWidth; // 480 - 110 = 370 (变宽了)      
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

    // ========================================================================
    // 修改：在等级数字后追加显示职业名称 (与主菜单风格保持一致)
    // ========================================================================

    Window_SkillStatus.prototype.drawCurrentActorStatus = function() {
        const actor = this._actor;
        if (!actor) return;

        // 1. 布局参数
        const faceSize = 144;
        const faceY = Math.floor((this.innerHeight - faceSize) / 2); 
        const faceX = 6; 

        // 2. 绘制头像背景框
        this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.6)");
        this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(faceX - 1, faceY - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");

        // 3. 绘制头像
        this.drawActorFace(actor, faceX, faceY, faceSize, faceSize);

        // 4. 绘制右侧文字信息
        // 由于窗口变宽了 (370px)，右侧空间非常充裕
        const dataX = faceX + faceSize + 16; // 稍微增加一点间距
        const startY = faceY; 

        // [名 字]
        this.contents.fontSize = 26;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); // 金色
        this.drawText(actor.name(), dataX, startY, 180); // 名字区域也可以宽一点
        this.contents.fontBold = false;

        // [等级图标 + 数字 + 职业]
        const row2Y = startY + 32;
        
        // (A) 图标
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconY = row2Y + 12; 
        
        const drawLv = () => {
            // 绘制 LV 图标
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, dataX, lvIconY);
            
            // (B) 等级数字 (青色)
            this.resetTextColor();
            this.contents.fontSize = 20; 
            this.changeTextColor('#00FFFF'); 
            // dataX + 24 是为了避开图标宽度
            this.drawText(actor.level, dataX + 24, row2Y + 2, 40);

            // (C) 【新增】职业名称 (浅灰色)
            // 放在数字右侧：24(图标位) + 36(数字位) ≈ 60
            this.contents.fontSize = 16; // 字体稍小显得精致
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); 
            this.drawText(actor.currentClass().name, dataX + 60, row2Y + 4, 120);
        };
        
        if (lvIcon.width > 0) drawLv(); else lvIcon.addLoadListener(drawLv);

        // [计量槽]
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

    // --- 技能帮助窗口 (Window_SkillHelp) ---
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

        // 优先读取特殊故事标签，没有则读取默认描述
        let text = this._item.meta.skillStory || this._item.meta.itemStory;
        if (!text) {
            text = this._item.description;
        }
        if (!text) return;

        let y = this.padding;
        this.contents.fontSize = Window_SkillHelp.storyContentSize;
        
        // 特殊故事用金色高亮，普通描述用白色
        if (this._item.meta.skillStory || this._item.meta.itemStory) {
            this.changeTextColor("#e6c510");
        } else {
            this.resetTextColor();
        }
        
        this.drawTextEx(text, this.padding, y, this.contents.width - this.padding * 2);
    };

    Scene_Skill.prototype.createHelpWindow = function() {
        const wx = 0;
        // 计算坐标：顶部180 + 列表240 = 420
        const wy = 420; 
        const ww = Graphics.boxWidth;
        // 高度：剩余所有空间 (854 - 420 = 434)
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
    // 修改：装备界面适配 (大空间槽位 + 统一字体介绍窗口)
    // ========================================================================

    const EQ_CONFIG = {
        statusH: 220,       // 状态窗口高度
        cmdH: 70,           // 指令窗口高度
        slotLines: 5,       // 目标显示行数
        faceSize: 144,      
        fontSize: {         
            name: 26,       
            level: 20,      
            paramLabel: 18, 
            paramVal: 20    
        }
    };

    // 1. 状态窗口 (Top)
    Scene_Equip.prototype.statusWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, EQ_CONFIG.statusH);
    };

    // 2. 指令窗口 (Middle)
    Scene_Equip.prototype.commandWindowRect = function() {
        const sRect = this.statusWindowRect();
        return new Rectangle(0, sRect.height, Graphics.boxWidth, EQ_CONFIG.cmdH);
    };

    // 3. 槽位窗口 (Middle-Low) - 【核心修改：大幅拉高】
    Scene_Equip.prototype.slotWindowRect = function() {
        const cRect = this.commandWindowRect();
        const wy = cRect.y + cRect.height;
        
        // 计算逻辑：
        // 5行标准高度 + 额外增加 50px 的缓冲空间
        // 这样不仅能放下5个，还有富余，彻底杜绝滚动条，界面也更舒展
        const wh = this.calcWindowHeight(EQ_CONFIG.slotLines, false) + 50;
        
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // 4. 物品选择列表 (Bottom) - 填满剩余空间
    Scene_Equip.prototype.itemWindowRect = function() {
        const sRect = this.slotWindowRect();
        const wy = sRect.y + sRect.height;
        const wh = Graphics.boxHeight - wy; // 自动计算剩余高度
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // 5. 帮助/故事窗口 (Bottom) - 位置同物品列表
    Scene_Equip.prototype.helpWindowRect = function() {
        return this.itemWindowRect();
    };

    // ========================================================================
    // 新增：装备故事窗口 (Window_EquipHelp)
    // 功能：替代原版帮助窗口，支持 <equipStory> 标签
    // 【修改】字体大小调整为 18 (与技能界面一致)
    // ========================================================================
    function Window_EquipHelp() {
        this.initialize(...arguments);
    }
    Window_EquipHelp.prototype = Object.create(Window_Base.prototype);
    Window_EquipHelp.prototype.constructor = Window_EquipHelp;
    
    // 【关键】统一字号配置：18
    Window_EquipHelp.storyContentSize = 18;  

    Window_EquipHelp.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
        this.padding = 12;
        
        // 强制加载 J2ME 风格皮肤
        this.loadWindowskin(); 
        this.backOpacity = 255; 
        this.opacity = 255;     
    };

    Window_EquipHelp.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem("Battlewindow");
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

        // 优先读取 <equipStory> 或 <itemStory>，没有则读取 description
        let text = this._item.meta.equipStory || this._item.meta.itemStory;
        let isStory = true;

        if (!text) {
            text = this._item.description;
            isStory = false;
        }

        if (!text) return;

        let y = this.padding;
        
        // 【关键】应用统一字号
        this.contents.fontFace = $gameSystem.mainFontFace();
        this.contents.fontSize = Window_EquipHelp.storyContentSize;
        
        if (isStory) {
            this.changeTextColor("#e6c510"); // 金色
        } else {
            this.resetTextColor(); // 白色
        }
        
        this.drawTextEx(text, this.padding, y, this.contents.width - this.padding * 2);
    };

    // 覆盖 Scene_Equip 创建帮助窗口的方法
    Scene_Equip.prototype.createHelpWindow = function() {
        const rect = this.helpWindowRect();
        this._helpWindow = new Window_EquipHelp(rect);
        this.addWindow(this._helpWindow);
    };

    // --- 装备状态窗口重构 (保持不变) ---
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
        const faceSize = 144;
        const faceY = Math.floor((this.innerHeight - faceSize) / 2);
        const faceX = 6; 
        this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.6)");
        this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(faceX - 1, faceY - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");
        this.drawActorFace(this._actor, faceX, faceY, faceSize, faceSize);
    };

    Window_EquipStatus.prototype.drawHeaderInfo = function() {
        const startX = 144 + 16; 
        const startY = 12;       
        this.contents.fontSize = EQ_CONFIG.fontSize.name;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); 
        this.drawText(this._actor.name(), startX, startY, 180);
        this.contents.fontBold = false;

        const row2Y = startY + 34;
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconY = row2Y + 6; 
        
        const drawExtra = () => {
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, startX, lvIconY);
            this.resetTextColor();
            this.contents.fontSize = EQ_CONFIG.fontSize.level;
            this.changeTextColor('#00FFFF'); 
            this.drawText(this._actor.level, startX + 24, row2Y, 40);
            this.contents.fontSize = 16;
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); 
            this.drawText(this._actor.currentClass().name, startX + 60, row2Y + 2, 120);
        };
        if (lvIcon.width > 0) drawExtra(); else lvIcon.addLoadListener(drawExtra);
    };

    Window_EquipStatus.prototype.drawParameters = function() {
        const startX = 144 + 16; 
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
        this.contents.fontSize = EQ_CONFIG.fontSize.paramLabel;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.param(paramId), x, y, labelW);

        const curVal = this._actor.param(paramId);
        this.resetTextColor();
        this.contents.fontSize = EQ_CONFIG.fontSize.paramVal;
        this.drawText(curVal, x + labelW, y, 40, "right");

        if (this._tempActor) {
             const newVal = this._tempActor.param(paramId);
             const diff = newVal - curVal;
             if (diff !== 0) {
                 this.changeTextColor(ColorManager.systemColor());
                 this.contents.fontSize = 16;
                 this.drawText("→", x + labelW + 42, y, 20, "center");
                 this.changeTextColor(ColorManager.paramchangeTextColor(diff));
                 this.contents.fontSize = EQ_CONFIG.fontSize.paramVal;
                 this.drawText(newVal, x + labelW + 62, y, 40, "left");
             }
        }
    };

    Window_EquipCommand.prototype.itemTextAlign = function() {
        return "center"; 
    };

    Window_EquipSlot.prototype.maxCols = function() { return 1; };
    // --- 状态界面适配 (Scene_Status) ---
    const STATUS_PROFILE_HEIGHT = 85; 
    
    Scene_Status.prototype.statusWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, 165);
    };
    Scene_Status.prototype.statusParamsWindowRect = function() {
        const topRect = this.statusWindowRect();
        const wy = topRect.y + topRect.height;
        const totalAvailableH = Graphics.boxHeight - STATUS_PROFILE_HEIGHT - topRect.height;
        const wh = Math.floor(totalAvailableH * 0.52); 
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };
    Scene_Status.prototype.statusEquipWindowRect = function() {
        const paramsRect = this.statusParamsWindowRect();
        const wy = paramsRect.y + paramsRect.height;
        const wh = Graphics.boxHeight - wy - STATUS_PROFILE_HEIGHT;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };
    Scene_Status.prototype.statusParamsWidth = function() {
        return Graphics.boxWidth;
    };
    Scene_Status.prototype.profileHeight = function() {
        return STATUS_PROFILE_HEIGHT;
    };
    Scene_Status.prototype.profileWindowRect = function() {
        const wh = this.profileHeight();
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // 状态界面专用的 Gauge
    class Sprite_StatusCustomGauge extends Sprite_Gauge {
        constructor() { super(); }
        bitmapWidth() { return 170; } 
        bitmapHeight() { return 30; } 
        gaugeHeight() { return 12; } // 美化：加厚
        gaugeBackColor() { return "#202020"; } // 美化：深色底
        
        // 美化：荧光色
        gaugeColor1() {
            switch (this._statusType) {
                case "hp": return "#ff6b6b";
                case "mp": return "#4d96ff";
                case "tp": return "#6bc547";
                default: return "#ffffff";
            }
        }
        gaugeColor2() {
            switch (this._statusType) {
                case "hp": return "#ff9f43";
                case "mp": return "#54a0ff";
                case "tp": return "#95d5b2";
                default: return "#ffffff";
            }
        }

        drawGaugeRect(x, y, width, height) {
            this.bitmap.fillRect(x, y, width, height, "rgba(0,0,0,0.5)"); // 描边
            super.drawGaugeRect(x + 1, y + 1, width - 2, height - 2);
        }

        drawLabel() {
            const iconName = this.gaugeIcon();
            if (!iconName) return;
            const bitmap = ImageManager.loadPicture(iconName);
            const iconX = 4;
            const iconY = 8;
            const iconSize = 12; 
            
            const draw = () => {
                this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
            };
            if (bitmap.width > 0) draw(); else bitmap.addLoadListener(draw);
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
            this.bitmap.drawText(currentValue, 0, -2, width - maxValueWidth + 2, height, "right");
            this.bitmap.textColor = "rgba(255, 255, 255, 0.8)";
            this.bitmap.fontSize = 12;
            this.bitmap.drawText(str, width - maxValueWidth, 0, maxValueWidth, height, "right");
        }
    }

    Window_Status.prototype.placeGauge = function(actor, type, x, y) {
        const key = "gauge-" + type;
        const sprite = this.createInnerSprite(key, Sprite_StatusCustomGauge);
        sprite.setup(actor, type);
        sprite.move(x, y);
        sprite.show();
    };

    // Window_Status 使用与 Window_MenuStatus 类似的排版
    Window_Status.prototype.refresh = function() {
        this.contents.clear();
        if (this._actor) {
            const faceX = 8;
            const faceY = 8;
            this.drawActorFace(this._actor, faceX, faceY);
            const dataX = 158;
            const dataY = 12;
            const lineHeight = 32;
            const HEADER_NAME_SIZE = 26;
            const HEADER_LEVEL_SIZE = 22;

            this.contents.fontSize = HEADER_NAME_SIZE;
            this.changeTextColor('rgba(255, 215, 0, 1)');
            this.drawText(this._actor.name(), dataX, dataY, 180);

            const levelY = dataY + lineHeight + 2;
            const lvImg = ImageManager.loadPicture("lvicon");
            // 原始逻辑绘制 lvicon
            const drawLv = () => {
                this.contents.blt(lvImg, 0, 0, lvImg.width, lvImg.height, dataX, levelY + 4);
            };
            if(lvImg.width > 0) drawLv(); else lvImg.addLoadListener(drawLv);

            this.resetTextColor();
            this.changeTextColor(ColorManager.hpColor(this._actor));
            this.contents.fontSize = HEADER_LEVEL_SIZE;
            // 调整数字位置以适应可能的图标宽度差异
            this.drawText(this._actor.level, dataX + 28, levelY - 5, 50);

            this.contents.fontSize = 17; 
            this.changeTextColor("rgba(255, 255, 255, 0.9)");
            this.drawText(this._actor.currentClass().name, dataX + 80, levelY - 5, 120);

            let gaugeY = levelY + 32; 
            const gaugeSpacing = this.gaugeLineHeight() + 2;

            this.placeGauge(this._actor, "hp", dataX, gaugeY);
            this.drawExpInfo(dataX + 155, gaugeY - 4, "current"); 
            gaugeY += gaugeSpacing;
            this.placeGauge(this._actor, "mp", dataX, gaugeY);
            this.drawExpInfo(dataX + 155, gaugeY - 100, "next"); 
            gaugeY += gaugeSpacing;
            if ($dataSystem.optDisplayTp) {
                this.placeGauge(this._actor, "tp", dataX, gaugeY);
            }
        }
    };

    Window_Status.prototype.drawExpInfo = function(x, y, type) {
        const width = 120; 
        const EXP_LABEL_SIZE = 20;
        const EXP_VALUE_SIZE = 24;
        this.contents.fontSize = EXP_LABEL_SIZE;
        this.changeTextColor(ColorManager.systemColor());
        let label = "";
        let value = "";
        if (type === "current") {
            label = TextManager.expA; 
            value = this._actor.currentExp();
        } else {
            label = "升级所需";
            value = this._actor.isMaxLevel() ? "已满级" : this._actor.nextRequiredExp();
        }
        this.drawText(label, x, y - 2, width, "right");
        this.contents.fontSize = EXP_VALUE_SIZE;
        this.changeTextColor(ColorManager.normalColor());
        this.drawText(value, x, y + 20, width, "right");
    };

    Window_Status.prototype.gaugeLineHeight = function() { return 28; };

    function applyCompactFont(windowObj) {
        windowObj.contents.fontFace = $gameSystem.mainFontFace();
        windowObj.contents.fontSize = 21; 
        windowObj.resetTextColor();
    }

    Window_StatusParams.prototype.lineHeight = function() { return 32; };
    Window_StatusParams.prototype.resetFontSettings = function() { applyCompactFont(this); };
    Window_StatusParams.prototype.updatePadding = function() { this.padding = 10; this._padding = 10; };

    Window_StatusEquip.prototype.lineHeight = function() { return 32; };
    Window_StatusEquip.prototype.resetFontSettings = function() { applyCompactFont(this); };
    Window_StatusEquip.prototype.updatePadding = function() { this.padding = 10; this._padding = 10; };

    Window_StatusEquip.prototype.drawItem = function(index) {
        const slotId = index;
        const actor = this._actor;
        if (slotId >= actor.equipSlots().length) return;
        const item = actor.equips()[slotId];
        const rect = this.itemLineRect(index);
        this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
        this.contents.fontSize = 21; 
        this.changeTextColor(ColorManager.systemColor());
        const equipSlotType = actor.equipSlots()[slotId]; 
        const slotTypeName = $dataSystem.equipTypes[equipSlotType] || "未知槽位"; 
        this.drawText(slotTypeName, rect.x + 4, rect.y + 2, 120, "left");

        const EQUIP_ICON_SIZE = 24;
        const iconX = rect.x + 130;
        const iconY = rect.y + (rect.height - EQUIP_ICON_SIZE) / 2;
        if (item) {
            this.drawIcon(item.iconIndex, iconX, iconY, EQUIP_ICON_SIZE);
        }
        this.changeTextColor(ColorManager.normalColor());
        const nameX = iconX + EQUIP_ICON_SIZE + 10;
        const nameWidth = rect.width - nameX + rect.x - 10;
        if (item) {
            this.drawText(item.name, nameX, rect.y + 2, nameWidth, "left");
        } else {
            this.drawText(TextManager.none || "无", nameX, rect.y + 2, nameWidth, "left"); 
        }
    };

    Window_StatusEquip.prototype.drawIcon = function(iconIndex, x, y, size = 24) {
        const bitmap = ImageManager.loadSystem("IconSet");
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size);
    };

    // --- 存档界面 (Scene_File) ---
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

    // --- 商店界面 (Scene_Shop) ---
    Scene_Shop.prototype.mainAreaTop = function() { return 0; };
    Scene_Shop.prototype.mainAreaHeight = function() {
        const helpHeight = this.calcWindowHeight(1, true); 
        return Graphics.boxHeight - this.mainAreaTop() - helpHeight;
    };
    Scene_Shop.prototype.mainCommandWidth = function() { return 180; };
    Scene_Shop.prototype.statusWidth = function() { return 180; };
    
    Scene_Shop.prototype.createHelpWindow = function() {
        const helpHeight = this.calcWindowHeight(1, true);
        const rect = new Rectangle(0, Graphics.boxHeight - helpHeight, Graphics.boxWidth, helpHeight);
        this._helpWindow = new Window_Help(rect);
        this.addWindow(this._helpWindow);
    };

    // 商店按钮逻辑
    Window_ShopNumber.prototype.createButtons = function() {
        this._buttons = [];
        if (ConfigManager.touchUI) {
            for (const type of ["down2", "down", "up", "up2", "ok"]) {
                const button = new Sprite_Button(type);
                this._buttons.push(button);
                this.addInnerChild(button);
            }
            this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
            this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
            this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
            this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
            this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
        }
    };
    Window_ShopNumber.prototype.buttonSpacing = function() { return 6; };
    Window_ShopNumber.prototype.placeButtons = function() {
        const sp = this.buttonSpacing();
        const availableWidth = this.innerWidth - 16; 
        const originalTotalWidth = this._buttons.reduce((r, button) => r + button.width + sp, -sp);
        let scaleFactor = 1;
        if (originalTotalWidth > availableWidth) {
            scaleFactor = availableWidth / originalTotalWidth; 
            scaleFactor = Math.max(scaleFactor, 0.7); 
        }
        let x = (this.innerWidth - (originalTotalWidth * scaleFactor)) / 2; 
        for (const button of this._buttons) {
            button.x = x;
            button.y = this.buttonY();
            button.scale.x = button.scale.y = scaleFactor;
            x += (button.width * scaleFactor) + sp;
        }
    };
    Window_ShopNumber.prototype.buttonY = function() {
        return Math.floor(this.totalPriceY() + this.lineHeight() * 2);
    };
    Window_ShopNumber.prototype.totalPriceY = function() {
        return Math.floor(this.itemNameY() + this.lineHeight() * 2);
    };
    Window_ShopNumber.prototype.itemNameY = function() {
        return Math.floor(this.innerHeight / 2 - this.lineHeight() * 1.5);
    };

    // ========================================================================
    // 模块 4：J2ME 风格补丁 (强制窗口皮肤与不透明度)
    // ========================================================================
    const targetWindowClasses = [
        Window_Help, Window_Gold, Window_MenuCommand, Window_MenuStatus,
        Window_MenuActor, Window_ItemCategory, Window_ItemList,
        Window_SkillType, Window_SkillStatus, Window_SkillList, Window_SkillHelp,
        Window_EquipCommand, Window_EquipSlot, Window_EquipItem, Window_EquipStatus,
        Window_Status, Window_StatusParams, Window_StatusEquip,
        Window_Options, Window_SavefileList, Window_GameEnd,
        Window_ShopCommand, Window_ShopBuy, Window_ShopSell, Window_ShopNumber, Window_ShopStatus
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

    Window_ShopNumber.prototype.setBackgroundType = function(type) {
        Window_Selectable.prototype.setBackgroundType.call(this, 0);
        this.opacity = 255;
        this.backOpacity = 255;
    };

})();