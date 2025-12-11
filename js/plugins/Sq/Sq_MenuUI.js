/*:
 * @target MZ
 * @plugindesc [系统] 菜单界面UI完全重绘 & 新存档界面 & 二级菜单重绘
 * @author 神枪手 & Gemini Optimization
 *
 * @param enableLoadCommand
 * @text 启用菜单读档指令
 * @type boolean
 * @default true
 * @desc 是否在主菜单命令窗口中添加“读档”选项。
 *
 * @help
 * ============================================================================
 * 插件说明 (Plugin Description)
 * ============================================================================
 * 本插件是专为《彩虹城堡》重制版定制的UI核心系统。
 * 它深度重写了 RMMZ 的 Window 和 Scene 类，以适配 480x854 的竖屏分辨率。
 * * 主要特性：
 * 1. 核心绘图：重写 Sprite_Gauge 实现荧光风格计量槽。
 * 2. 主菜单：重构 Window_MenuStatus，实现大头像(144px)紧贴布局。
 * 3. 二级场景：全覆盖重写 (Item, Skill, Equip, Status, Shop, Save)。
 * 4. 视觉风格：强制不透明背景，模拟 J2ME 时代的硬朗UI风格。
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

    // ========================================================================
    // [Core Module] 资源预加载与系统初始化
    // 继承: Scene_Boot
    // ========================================================================
    const _Scene_Boot_loadSystemImages = Scene_Boot.prototype.loadSystemImages;
    Scene_Boot.prototype.loadSystemImages = function() {
        _Scene_Boot_loadSystemImages.call(this);
        // 加载窗口皮肤颜色配置
        ColorManager.loadWindowskin();
        // 加载图标集
        ImageManager.loadSystem("IconSet");
        
        // [RMMZ API] ImageManager.loadPicture 用于加载 img/pictures 资源
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
    // 继承: Sprite_Gauge (rmmz_sprites.js)
    // ========================================================================
    class Sprite_MenuGauge extends Sprite_Gauge {
        constructor() {
            super();
        }

        // [Layout] 宽度适配右侧窗口 (窗口宽340 - 头像144 - padding)
        bitmapWidth() { return 145; } 
        bitmapHeight() { return 32; }
        gaugeHeight() { return 14; } // 增加厚度以适应图标

        // [Color] 计量槽背景色
        gaugeBackColor() { return "#202020"; }

        // [Color] 渐变色起始值 (荧光色系)
        gaugeColor1() {
            switch (this._statusType) {
                case "hp": return "#ff6b6b"; // 亮红
                case "mp": return "#4d96ff"; // 亮蓝
                case "tp": return "#6bc547"; // 亮绿
                default: return "#ffffff";
            }
        }

        // [Color] 渐变色结束值
        gaugeColor2() {
            switch (this._statusType) {
                case "hp": return "#ff9f43"; // 橙色过渡
                case "mp": return "#54a0ff"; // 浅蓝过渡
                case "tp": return "#95d5b2"; // 浅绿过渡
                default: return "#ffffff";
            }
        }

        // [Draw] 重写槽体绘制，添加半透明底板
        drawGaugeRect(x, y, width, height) {
            this.bitmap.fillRect(x, y, width, height, "rgba(0,0,0,0.5)");
            super.drawGaugeRect(x + 1, y + 1, width - 2, height - 2);
        }

        // [Draw] 绘制左侧图标 (覆盖原本的 HP/MP 文字标签)
        drawLabel() {
            const iconName = this.gaugeIcon();
            if (!iconName) return;
            const bitmap = ImageManager.loadPicture(iconName);
            const iconX = 0; 
            const iconY = 12; // 图标垂直居中校正
            const iconSize = 12; 
            
            const drawIcon = () => {
                // [Fix] 这里的修复防止对象销毁后继续绘制导致崩溃
                if (!this.bitmap || !this.bitmap.context) return;

                // 使用 blt 进行位图传输
                this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
            };

            if (bitmap.isReady()) {
                drawIcon();
            } else {
                bitmap.addLoadListener(drawIcon);
            }
        }

        // 辅助方法：获取对应类型的图标文件名
        gaugeIcon() {
            switch (this._statusType) {
                case "hp": return "hpicon";
                case "mp": return "mpicon";
                case "tp": return "tpicon";
                default: return null;
            }
        }

        // [Draw] 绘制数值 (格式: 当前值 / 最大值)
        drawValue() {
            const currentValue = this.currentValue();
            const currentMaxValue = this.currentMaxValue();
            const width = this.bitmapWidth();
            const height = this.textHeight();
            let str = `/${currentMaxValue}`;
            let maxValueWidth = this.bitmap.measureTextWidth(str);
            
            // 绘制当前值 (高亮)
            this.bitmap.textColor = "rgba(255, 255, 255, 1)";
            this.bitmap.fontSize = 18; 
            this.bitmap.drawText(currentValue, 0, -4, width - maxValueWidth + 2, height, "right");
            
            // 绘制最大值 (半透明)
            this.bitmap.textColor = "rgba(255, 255, 255, 0.7)";
            this.bitmap.fontSize = 12;
            this.bitmap.drawText(`/${currentMaxValue}`, width - maxValueWidth, -2, maxValueWidth, height, "right");
        }
    }
    // 将自定义类挂载到全局，供 Window 类调用
    window.Sprite_MenuGauge = Sprite_MenuGauge;

    // ========================================================================
    // [Module 1] 主菜单与通用背景 (Main Menu & Background)
    // 继承: Scene_MenuBase, Scene_Menu
    // ========================================================================

    // 重写背景生成：使用图片替代截图模糊
    Scene_MenuBase.prototype.createBackground = function() {
        this._backgroundFilter = new PIXI.filters.BlurFilter();
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = ImageManager.loadPicture("Menu");
        this._backgroundSprite.filters = [];
        this.addChild(this._backgroundSprite);
        this.setBackgroundOpacity(255);
    };

    // [Layout] 主菜单命令窗口布局
    Scene_Menu.prototype.commandWindowRect = function() {
        const ww = 140;
        const wh = 490; 
        const wx = 0;
        const wy = -5; // 顶部微调
        return new Rectangle(wx, wy, ww, wh);
    };

    // [Layout] 主菜单状态窗口布局 (右侧大块区域)
    Scene_Menu.prototype.statusWindowRect = function() {
        const ww = 340; // 480(屏宽) - 140(命令宽)
        const wh = 854; 
        const wx = 140;
        const wy = -5;
        return new Rectangle(wx, wy, ww, wh);
    };

    // [Layout] 金币窗口布局 (左下角)
    Scene_Menu.prototype.goldWindowRect = function() {
        const ww = 144;    
        const wh = 70;     
        const wx = 0;      
        const wy = 854 - wh - 5; 
        return new Rectangle(wx, wy, ww, wh);
    };

    // 金币窗口刷新逻辑：调整字号
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
    // 核心逻辑：紧贴边框排版与防溢出处理
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

    // [Override] 重写列表项绘制流程
    Window_MenuStatus.prototype.drawItem = function(index) {
        const rect = this.itemRect(index);
        const faceSize = 144; 
        
        // 计算垂直居中偏移
        const offsetY = Math.floor((rect.height - faceSize) / 2); 

        // 缓存布局参数，供子绘制函数使用
        this._tempParams = { 
            faceSize: faceSize,
            offsetY: offsetY,
            faceX: rect.x + 4, // 稍微靠左
            faceY: rect.y + offsetY
        };

        this.drawPendingItemBackground(index);
        this.drawItemImage(index);   // 绘制头像
        this.drawSlotCardBg(index);  // 绘制头像边框 (装饰层)
        this.drawItemStatus(index);  // 绘制右侧状态信息
    };

    // 绘制头像
    Window_MenuStatus.prototype.drawItemImage = function(index) {
        const actor = this.actor(index);
        const p = this._tempParams;
        if (!actor || !p) return;
        
        this.drawActorFace(actor, p.faceX, p.faceY, p.faceSize, p.faceSize);
    };

    // [New] 绘制头像装饰边框 (J2ME风格关键)
    Window_MenuStatus.prototype.drawSlotCardBg = function(index) {
        const p = this._tempParams;
        if (!p) return;
        const x = p.faceX;
        const y = p.faceY;
        const s = p.faceSize;

        // 金色主框
        this.contents.strokeRect(x, y, s, s, "rgba(255, 215, 0, 0.8)"); 
        // 外部阴影框
        this.contents.strokeRect(x - 1, y - 1, s + 2, s + 2, "rgba(0, 0, 0, 0.5)"); 
    };

    // [Override] 绘制右侧详细信息
    Window_MenuStatus.prototype.drawItemStatus = function(index) {
        const actor = this.actor(index);
        const p = this._tempParams;
        if (!actor || !p) return;
        
        // --- 坐标定义 ---
        const dataX = p.faceX + p.faceSize + 10; // 头像右侧 + 间距
        const startY = p.faceY; 

        // --- Row 1: 角色名字 ---
        this.contents.fontSize = 26; 
        this.contents.fontBold = true; 
        this.changeTextColor('#FFD700'); // 金色高亮
        this.drawText(actor.name(), dataX, startY, 150);
        this.contents.fontBold = false; 

        // --- Row 2: 等级与职业 ---
        const row2Y = startY + 32;
        
        // (A) 等级图标
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconX = dataX;
        const lvIconY = row2Y + 12; 
        
        const drawLvStuff = () => {
            // [Fix] 防止窗口关闭后回调执行导致崩溃
            if (!this.contents || !this.contents.context) return;

            // 绘制图标
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, lvIconX, lvIconY);
            
            // (B) 等级数字
            const numX = lvIconX + 24; 
            this.resetTextColor();
            this.contents.fontSize = 20;
            this.changeTextColor('#00FFFF'); // 青色
            this.drawText(actor.level, numX, row2Y + 2, 40);

            // (C) 职业名称
            const classX = numX + 36; 
            this.contents.fontSize = 16;
            this.changeTextColor("rgba(200, 200, 200, 0.8)"); // 浅灰
            this.drawText(actor.currentClass().name, classX, row2Y + 4, 100);
        };

        if (lvIcon.width > 0) drawLvStuff(); else lvIcon.addLoadListener(drawLvStuff);

        // --- Row 3 & 4: 计量槽 ---
        let gaugeY = row2Y + 34;
        const gaugeSpacing = 32;

        // 调用自定义的 Sprite_MenuGauge
        this.placeGauge(actor, "hp", dataX, gaugeY);
        this.placeGauge(actor, "mp", dataX, gaugeY + gaugeSpacing); 
        
        if ($dataSystem.optDisplayTp) {
            this.placeGauge(actor, "tp", dataX, gaugeY + gaugeSpacing * 2);
        }
    };

    // 实例化计量槽精灵
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
    
    // 向菜单列表注入 Load 命令
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

    // 绑定 Handler
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
    // 特点：左窄右宽布局，超大底部说明窗口
    // ========================================================================

    // [Layout] 角色选择窗口 (用于技能/物品的目标选择)
    Window_MenuActor.prototype.initialize = function(rect) {
        rect.x = 0;
        rect.y = 0;
        rect.width = 400;
        rect.height = Graphics.boxHeight - 120; 
        Window_MenuStatus.prototype.initialize.call(this, rect);
        this.hide();
    };

    // [Layout] 技能列表 (Window_SkillList)
    const _original_Window_SkillList_initialize = Window_SkillList.prototype.initialize;
    Window_SkillList.prototype.initialize = function(rect) {
        if (SceneManager._scene instanceof Scene_Skill) {
            rect.x = 0;        
            rect.y = 180; // 紧接上方状态窗口
            rect.width = 480;
            
            // 固定显示6行高度
            rect.height = 240; 
            
            Window_Selectable.prototype.initialize.call(this, rect);
            this._actor = null;
            this._stypeId = 0;
            this._data = [];
        } else {
            _original_Window_SkillList_initialize.call(this, rect);
        }
    };

    // [Layout] 技能类型窗口 (Window_SkillType) - 右上角
    Window_SkillType.prototype.initialize = function(rect) {
        const typeWidth = 110; 
        
        rect.width = typeWidth;    
        rect.x = Graphics.boxWidth - typeWidth; // 靠右对齐
        rect.y = 0;         
        rect.height = 180;   
        Window_Command.prototype.initialize.call(this, rect);
        this._actor = null;
    };

    // [Layout] 技能状态窗口 (Window_SkillStatus) - 左上角
    Window_SkillStatus.prototype.initialize = function(rect) {
        const typeWidth = 110; 

        rect.x = 0;                
        rect.y = 0;               
        rect.width = Graphics.boxWidth - typeWidth; // 填满左侧剩余空间      
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

    // [Draw] 技能界面的角色状态绘制 (包含职业显示)
    Window_SkillStatus.prototype.drawCurrentActorStatus = function() {
        const actor = this._actor;
        if (!actor) return;

        // 1. 布局参数
        const faceSize = 144;
        const faceY = Math.floor((this.innerHeight - faceSize) / 2); 
        const faceX = 6; 

        // 2. 绘制头像与装饰框
        this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.6)");
        this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(faceX - 1, faceY - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");

        // 3. 绘制头像
        this.drawActorFace(actor, faceX, faceY, faceSize, faceSize);

        // 4. 右侧信息绘制
        const dataX = faceX + faceSize + 16; 
        const startY = faceY; 

        // [名字]
        this.contents.fontSize = 26;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); 
        this.drawText(actor.name(), dataX, startY, 180); 
        this.contents.fontBold = false;

        // [等级图标 + 数字 + 职业]
        const row2Y = startY + 32;
        
        // (A) 图标
        const lvIcon = ImageManager.loadPicture("lvicon");
        const lvIconY = row2Y + 12; 
        
        const drawLv = () => {
            this.contents.blt(lvIcon, 0, 0, lvIcon.width, lvIcon.height, dataX, lvIconY);
            
            // (B) 等级数字
            this.resetTextColor();
            this.contents.fontSize = 20; 
            this.changeTextColor('#00FFFF'); 
            this.drawText(actor.level, dataX + 24, row2Y + 2, 40);

            // (C) 职业名称
            this.contents.fontSize = 16; 
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

    // 精灵绑定辅助
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

    // --- 技能帮助/故事窗口 (Window_SkillHelp) ---
    // 特点：支持 itemStory 元数据，自定义字体颜色和大小
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

        // 优先读取 <skillStory> 或 <itemStory> 标签内容
        let text = this._item.meta.skillStory || this._item.meta.itemStory;
        if (!text) {
            text = this._item.description;
        }
        if (!text) return;

        let y = this.padding;
        this.contents.fontSize = Window_SkillHelp.storyContentSize;
        
        // 故事描述使用金色，普通描述使用白色
        if (this._item.meta.skillStory || this._item.meta.itemStory) {
            this.changeTextColor("#e6c510");
        } else {
            this.resetTextColor();
        }
        
        this.drawTextEx(text, this.padding, y, this.contents.width - this.padding * 2);
    };

    // 注册帮助窗口到场景
    Scene_Skill.prototype.createHelpWindow = function() {
        const wx = 0;
        const wy = 420; // 顶部180 + 列表240
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy; // 占据底部剩余空间
        
        this._helpWindow = new Window_SkillHelp(new Rectangle(wx, wy, ww, wh));
        this.addWindow(this._helpWindow);
    };

    // 关联帮助更新
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
    // 布局：状态(220) -> 指令(70) -> 槽位&物品(重叠) -> 底部故事
    // ========================================================================

    const SQ_EQUIP_CONFIG = {
        statusH: 220,       // 状态窗口高度
        cmdH: 70,           // 指令窗口高度
        slotLines: 5,       // 槽位行数
        faceSize: 144,      
        fontSize: {         
            name: 26,       
            level: 20,      
            paramLabel: 18, 
            paramVal: 20    
        }
    };

    // 1. 状态窗口
    Scene_Equip.prototype.statusWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, SQ_EQUIP_CONFIG.statusH);
    };

    // 2. 指令窗口
    Scene_Equip.prototype.commandWindowRect = function() {
        const sRect = this.statusWindowRect();
        return new Rectangle(0, sRect.height, Graphics.boxWidth, SQ_EQUIP_CONFIG.cmdH);
    };

    // 3. 槽位窗口 (显示当前装备)
    Scene_Equip.prototype.slotWindowRect = function() {
        const cRect = this.commandWindowRect();
        const wy = cRect.y + cRect.height;
        const wh = this.calcWindowHeight(SQ_EQUIP_CONFIG.slotLines, false) + 52;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // 4. 物品选择窗口 (显示背包装备)
    // [Fix] 与槽位窗口重叠，避免位置错乱
    Scene_Equip.prototype.itemWindowRect = function() {
        return this.slotWindowRect();
    };

    // [Draw] 优化装备选择列表 (空物品显示“卸下”)
    Window_EquipItem.prototype.drawItem = function(index) {
        const item = this.itemAt(index);
        const rect = this.itemLineRect(index);

        if (item) {
            this.drawItemName(item, rect.x, rect.y, rect.width);
        } else {
            // 绘制“卸下”选项
            this.contents.fontSize = 22; 
            this.changeTextColor("#eff313ff"); // 淡黄色
            this.drawText("卸下当前装备", rect.x, rect.y, rect.width, "center");
            this.resetFontSettings();
        }
    };
    
    // 包含空物品逻辑
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

    // 5. 帮助/故事窗口 (底部固定)
    Scene_Equip.prototype.helpWindowRect = function() {
        const sRect = this.slotWindowRect();
        const wy = sRect.y + sRect.height; 
        const wh = Graphics.boxHeight - wy;
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // --- 装备描述窗口 (Window_EquipHelp) ---
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
        
        // 强制不透明皮肤
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

    // --- 装备状态窗口重构 (Window_EquipStatus) ---
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

    // 绘制带框头像
    Window_EquipStatus.prototype.drawFaceWithFrame = function() {
        const faceSize = SQ_EQUIP_CONFIG.faceSize;
        const faceY = Math.floor((this.innerHeight - faceSize) / 2);
        const faceX = 6; 
        this.contents.fillRect(faceX, faceY, faceSize, faceSize, "rgba(0, 0, 0, 0.6)");
        this.contents.strokeRect(faceX, faceY, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(faceX - 1, faceY - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");
        this.drawActorFace(this._actor, faceX, faceY, faceSize, faceSize);
    };

    // 绘制头部信息 (名字、等级、职业)
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
            // [Fix] 防止窗口销毁后访问上下文导致崩溃
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

    // 绘制属性对比 (双列布局)
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

        // 绘制变更预览 (箭头 + 新数值)
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

    // 1. 场景布局
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

    // ------------------------------------------------------------------------
    // [Custom Window] Window_StatusMain (整合的状态主窗口)
    // ------------------------------------------------------------------------
    
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
            
            // 区域1: 头部 (头像+基础信息)
            this.drawHeaderSection(padding, 12);

            // 区域2: 属性 (六维+高级参数)
            this.drawParametersSection(padding, 185);

            // 区域3: 装备
            this.drawEquipSection(padding, 465);
        }
    };

    Window_StatusMain.prototype.drawSectionBg = function(x, y, width, height) {
        this.contents.fillRect(x, y, width, height, "rgba(0, 0, 0, 0.3)");
        this.contents.fillRect(x, y, width, 2, "rgba(255, 255, 255, 0.1)");
        this.contents.fillRect(x, y + height - 1, width, 1, "rgba(0, 0, 0, 0.5)");
    };

    // [Section] 头部区域
    Window_StatusMain.prototype.drawHeaderSection = function(x, y) {
        const actor = this._actor;
        const faceSize = 144;
        
        // 头像与边框
        this.drawActorFace(actor, x + 6, y, faceSize, faceSize);
        this.contents.strokeRect(x + 6, y, faceSize, faceSize, "rgba(255, 215, 0, 0.8)");
        this.contents.strokeRect(x + 5, y - 1, faceSize + 2, faceSize + 2, "rgba(0, 0, 0, 0.5)");

        // 信息区
        const infoX = x + faceSize + 24; 
        let currentY = y; 

        // 姓名
        this.contents.fontSize = 28;
        this.contents.fontBold = true;
        this.changeTextColor('#FFD700'); 
        this.drawText(actor.name(), infoX, currentY, 200);
        this.contents.fontBold = false;
        
        currentY += 36;

        // 职业与等级
        const lvIcon = ImageManager.loadPicture("lvicon");
        const drawLvY = currentY; 
        
        const drawLv = () => {
            // [Fix] 防止野指针崩溃
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

        // 经验值
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

        // 计量槽
        const gaugeSpacing = 30;
        this.placeGauge(actor, "hp", infoX, currentY);
        currentY += gaugeSpacing;
        this.placeGauge(actor, "mp", infoX, currentY);
        if ($dataSystem.optDisplayTp) {
            currentY += gaugeSpacing;
            this.placeGauge(actor, "tp", infoX, currentY);
        }
    };

    // [Section] 属性区域
    Window_StatusMain.prototype.drawParametersSection = function(x, y) {
        const actor = this._actor;
        const width = this.innerWidth - x * 2;
        const height = 260;
        
        this.drawSectionBg(x, y, width, height);

        // 标题
        this.contents.fontSize = 22;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("角色属性", x + 10, y + 10, 200);
        
        const lineHeight = 34;
        const startY = y + 45;
        const colWidth = width / 2 - 10;
        const col2X = x + width / 2 + 10;

        // 左列：六维
        for (let i = 0; i < 6; i++) {
            const paramId = 2 + i;
            const dy = startY + i * lineHeight;
            this.drawParamLine(x + 10, dy, colWidth, TextManager.param(paramId), actor.param(paramId));
        }

        // 右列：高级属性
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

    // [Section] 装备区域
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

    // 精灵管理
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

    // [Override] 商店按钮适配
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
    // [Module 7] 物品界面重构 (Scene_Item)
    // 布局：分类(70) -> 列表(双列) -> 底部超大故事窗口(300)
    // ========================================================================

    const SQ_ITEM_CONFIG = {
        catH: 70,       // 分类高度
        helpH: 300,     // 故事高度
    };

    // 1. 分类窗口
    Scene_Item.prototype.categoryWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, SQ_ITEM_CONFIG.catH);
    };

    // 2. 物品列表
    Scene_Item.prototype.itemWindowRect = function() {
        const wy = SQ_ITEM_CONFIG.catH; 
        const wh = Graphics.boxHeight - SQ_ITEM_CONFIG.catH - SQ_ITEM_CONFIG.helpH; 
        return new Rectangle(0, wy, Graphics.boxWidth, wh);
    };

    // [Override] 物品列表双列显示
    Window_ItemList.prototype.maxCols = function() {
        return 2; 
    };
    
    Window_ItemList.prototype.spacing = function() {
        return 12;
    };

    // 4. 自定义物品描述窗口 (Window_ItemUserHelp)
    // 特点：强制 18 号字，防止被系统重置
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

    // [Fix] 核心修复：锁死字号，避免 drawTextEx 重置
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
            this.changeTextColor("#e6c510"); // 故事文本高亮
        } else {
            this.resetTextColor(); 
        }

        this.drawTextEx(text, 4, 4, this.contents.width - 8);
    };

    // 注册帮助窗口
    Scene_Item.prototype.createHelpWindow = function() {
        const wy = Graphics.boxHeight - SQ_ITEM_CONFIG.helpH;
        const rect = new Rectangle(0, wy, Graphics.boxWidth, SQ_ITEM_CONFIG.helpH);
        this._helpWindow = new Window_ItemUserHelp(rect);
        this.addWindow(this._helpWindow);
    };

    // 关联更新
    const _Window_ItemList_updateHelp = Window_ItemList.prototype.updateHelp;
    Window_ItemList.prototype.updateHelp = function() {
        if (SceneManager._scene instanceof Scene_Item && this._helpWindow) {
            this._helpWindow.setItem(this.item());
        } else {
            _Window_ItemList_updateHelp.call(this);
        }
    };

    // ========================================================================
    // [Module 8] 存档界面卡片化 (Window_SavefileList 重写)
    // ========================================================================

    // [Core Extension] 扩展存档信息：写入地图名、金币、等级
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

    // [Draw] 绘制存档卡片
    Window_SavefileList.prototype.drawItem = function(index) {
        const savefileId = this.indexToSavefileId(index);
        const info = DataManager.savefileInfo(savefileId);
        const rect = this.itemRectWithPadding(index);

        // 绘制渐变背景
        this.drawSaveCardBg(rect);

        if (!info) {
            this.drawEmptySlot(savefileId, rect);
            return;
        }

        // 1. 头像绘制 (使用 blt 缩放)
        this.drawScaledFace(info, rect);

        // 2. 信息布局
        const contentX = rect.x + SQ_SAVE_CONFIG.faceSize + 16;
        const contentW = rect.width - contentX - 10;
        let curY = rect.y + 6;

        // 3. 第一行：ID + 地图名
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

        // 4. 第二行：等级 + 金币
        this.contents.fontSize = SQ_SAVE_CONFIG.fontSize.info;
        this.resetTextColor();
        
        const lvText = `等级: ${info.leaderLv || '?'}`;
        this.drawText(lvText, contentX, curY, 100);

        const goldText = `银币: ${info.gold !== undefined ? info.gold : '?'}`;
        this.changeTextColor("#ffffa0"); 
        this.drawText(goldText, contentX + 110, curY, 150);
        
        curY += 28;

        // 5. 第三行：时间 + 日期
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

    // 辅助：绘制卡片背景
    Window_SavefileList.prototype.drawSaveCardBg = function(rect) {
        const ctx = this.contents.context;
        const grd = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y);
        grd.addColorStop(0, "rgba(0, 0, 0, 0.6)");   
        grd.addColorStop(1, "rgba(0, 0, 0, 0.2)");   
        
        ctx.fillStyle = grd;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        this.contents.fillRect(rect.x, rect.y + rect.height - 1, rect.width, 1, "rgba(255, 255, 255, 0.2)");
    };

    // 辅助：头像缩放绘制
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

    // 辅助：绘制空白档位
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
    // 强制所有相关窗口使用 Battlewindow 皮肤且完全不透明，模拟 J2ME 观感
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