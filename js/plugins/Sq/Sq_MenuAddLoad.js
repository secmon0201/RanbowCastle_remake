/*:
 * @target MZ
 * @plugindesc [系统] 竖屏菜单界面重构 & 菜单读档功能 & 技能装备状态适配
 * @author 神枪手 & Gemini
 * * @param enableLoadCommand
 * @text 启用菜单读档功能
 * @type boolean
 * @default true
 * @desc 是否在菜单中添加读档选项。true=启用，false=禁用。
 * * @help
 * ============================================================================
 * 分辨率适配说明 (480x854)
 * ============================================================================
 * 已针对 480x854 竖屏分辨率进行调整：
 * 1. 角色选择窗口高度拉伸，填补垂直空间。
 * 2. 技能列表窗口高度增加（显示更多技能行数）。
 * 3. 技能帮助窗口自适应剩余底部空间。
 * 4. 状态界面比例微调。
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginParams = PluginManager.parameters('Sq_MenuAddLoad');
    const enableLoadCommand = pluginParams.enableLoadCommand === 'true';

    // 1. 在菜单命令窗口中添加读档选项
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

})();

// 技能角色选择窗口
Window_MenuActor.prototype.initialize = function(rect) {
    rect.x = 0;
    rect.y = 0;
    rect.width = 400;
    
    // [适配854] 修改高度逻辑
    // 原来是固定500，现在改为根据屏幕高度动态计算
    // 预留约140px给底部的按钮或留白，或者直接填满大部分区域
    rect.height = Graphics.boxHeight - 120; 
    
    Window_MenuStatus.prototype.initialize.call(this, rect);
    this.hide();
};

// ===== 关键修改：为Window_SkillList添加场景判断 =====
const _original_Window_SkillList_initialize = Window_SkillList.prototype.initialize;

Window_SkillList.prototype.initialize = function(rect) {
    if (SceneManager._scene instanceof Scene_Skill) {
        rect.x = 0;        
        rect.y = 170; // 保持顶部状态窗口避让位置        
        rect.width = 480;   
        
        // [适配854] 增加技能列表高度
        // 原200(约3排) -> 改为340(约5-6排)，充分利用长屏优势
        rect.height = 340; 
        
        Window_Selectable.prototype.initialize.call(this, rect);
        this._actor = null;
        this._stypeId = 0;
        this._data = [];
    } else {
        _original_Window_SkillList_initialize.call(this, rect);
    }
};

// 技能角色状态窗口 (头像/血条)
function Window_SkillStatus() {
    this.initialize(...arguments);
}

Window_SkillStatus.prototype = Object.create(Window_StatusBase.prototype);
Window_SkillStatus.prototype.constructor = Window_SkillStatus;

Window_SkillStatus.prototype.initialize = function(rect) {
    rect.x = 0;                
    rect.y = -5;               
    rect.width = 320;          
    rect.height = 180; // 保持原高度，头部信息不需要太高
    
    Window_StatusBase.prototype.initialize.call(this, rect);
    this._actor = null;
    
    this._nameFontSize = 22;    
    this._levelFontSize = 16;   
    this._classFontSize = 16;   
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
    
    const padding = this.padding;
    const x = 0;
    const y = 0;
    
    const faceWidth = 144;      
    const faceHeight = 144;     
    const nameOffsetX = 140;    
    const nameOffsetY = 0;      
    const levelOffsetY = 20;    
    const classOffsetY = 0;     
    const gaugeOffsetY = 30;    
    const gaugeSpacing = 8;     
    
    this.drawActorFace(actor, x, y, faceWidth, faceHeight);
    
    this.contents.fontSize = this._nameFontSize;
    this.changeTextColor('rgba(255, 223, 0, 1)');
    this.drawText(actor.name(), x + nameOffsetX, y + nameOffsetY, 200);
    
    this.contents.fontSize = this._levelFontSize;
    this.changeTextColor(ColorManager.hpColor(actor));
    this.drawText(`Lv${actor.level}`, x + nameOffsetX, y + levelOffsetY, 80);
    
    this.contents.fontSize = this._classFontSize;
    this.changeTextColor("rgba(255, 255, 255, 0.8)");
    this.drawText(actor.currentClass().name, x + nameOffsetX + 70, y + classOffsetY, 180);
    
    const gaugeX = x + 133;     
    const gaugeStartY = y + 45; 
    
    this.placeGauge(actor, "hp", gaugeX, gaugeStartY);
    this.placeGauge(actor, "mp", gaugeX, gaugeStartY + this.gaugeLineHeight() + gaugeSpacing);
    
    if ($dataSystem.optDisplayTp) {
        this.placeGauge(actor, "tp", gaugeX, gaugeStartY + this.gaugeLineHeight() * 2 + gaugeSpacing * 2);
    }
    
    this.resetFontSettings();
};

Window_SkillStatus.prototype.placeGauge = function(actor, type, x, y) {
    const key = `actor${actor.actorId()}-skillgauge-${type}`;
    const sprite = this.createInnerSprite(key, Sprite_MenuGauge);
    sprite.setup(actor, type);
    sprite.move(x, y);
    sprite.show();
};

Window_SkillStatus.prototype.gaugeLineHeight = function() {
    return 18; 
};

// 技能类型选择窗口
Window_SkillType.prototype.initialize = function(rect) {
    rect.x = 320;        
    rect.y = -5;         
    rect.width = 160;    
    rect.height = 180;   
    
    Window_Command.prototype.initialize.call(this, rect);
    this._actor = null;
};

// 技能帮助窗口 (背景故事)
function Window_SkillHelp() {
    this.initialize(...arguments);
}

Window_SkillHelp.prototype = Object.create(Window_Base.prototype);
Window_SkillHelp.prototype.constructor = Window_SkillHelp;

Window_SkillHelp.storyTitleSize = 14;    
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

    const story = this._item.meta.skillStory || this._item.meta.itemStory;
    if (!story) return;

    let y = this.padding;

    this.contents.fontSize = Window_SkillHelp.storyContentSize;
    this.changeTextColor("#e6c510");
    this.drawTextEx(story, this.padding, y, this.contents.width - this.padding * 2);
};

// 场景中创建帮助窗口 (适配 854)
Scene_Skill.prototype.createHelpWindow = function() {
    const wx = 0;
    
    const listY = 170;
    // [适配854] 必须与 Window_SkillList 中的高度保持一致
    const listHeight = 340; 
    
    const wy = listY + listHeight; // 170 + 340 = 510
    const ww = Graphics.boxWidth;
    
    // 自动计算剩余高度：854 - 510 = 344 (仍然有很大的空间显示背景故事)
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

(() => {
    // ============================================================
    // 装备界面适配 854
    // ============================================================
    
    const UI_CONFIG = {
        statusH: 230,       // 保持原样，顶部够用了
        cmdH: 70,          
        faceSize: 144,      
        col1Width: 154,     
        paramLineH: 32,     
        fontSize: {         
            name: 24,       
            level: 18,      
            paramLabel: 22, 
            paramVal: 24    
        }
    };

    Scene_Equip.prototype.statusWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, UI_CONFIG.statusH);
    };

    Scene_Equip.prototype.commandWindowRect = function() {
        const sRect = this.statusWindowRect();
        return new Rectangle(0, sRect.height, Graphics.boxWidth, UI_CONFIG.cmdH);
    };

    Scene_Equip.prototype.helpWindowRect = function() {
        // [适配854] 帮助窗口可以稍微高一点点，或者保持2行
        const wh = this.calcWindowHeight(2, false); 
        return new Rectangle(0, Graphics.boxHeight - wh, Graphics.boxWidth, wh);
    };

    // 装备槽位窗口 - 将自动填满中间变大的区域
    Scene_Equip.prototype.slotWindowRect = function() {
        const cRect = this.commandWindowRect();
        const hRect = this.helpWindowRect();
        return new Rectangle(0, cRect.y + cRect.height, Graphics.boxWidth, hRect.y - (cRect.y + cRect.height));
    };
    
    Scene_Equip.prototype.itemWindowRect = function() {
        return this.slotWindowRect();
    };

    // Window_EquipStatus 保持原逻辑不变，因为它是固定高度
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
            this.drawLeftArea();   
            this.drawDivider();    
            this.drawRightParams();
        }
    };

    Window_EquipStatus.prototype.drawLeftArea = function() {
        const faceY = 0; 
        this.drawActorFace(this._actor, 0, faceY); 

        const nameY = UI_CONFIG.faceSize + 4; 
        this.resetFontSettings();             
        this.contents.fontSize = UI_CONFIG.fontSize.name; 
        
        this.changeTextColor('rgba(255, 223, 0, 1)'); 
        this.drawText(this._actor.name(), 0, nameY, UI_CONFIG.faceSize, 'center'); 

        const levelY = nameY + 28; 
        this.contents.fontSize = UI_CONFIG.fontSize.level; 
        this.changeTextColor(ColorManager.systemColor()); 
        this.drawText(TextManager.levelA + " " + this._actor.level, 0, levelY, UI_CONFIG.faceSize, 'center'); 
    };

    Window_EquipStatus.prototype.drawDivider = function() {
        const x = UI_CONFIG.col1Width; 
        const h = this.innerHeight;    
        this.contents.paintOpacity = 60; 
        this.contents.fillRect(x, 10, 1, h - 20, ColorManager.normalColor()); 
        this.contents.paintOpacity = 255; 
    };

    Window_EquipStatus.prototype.drawRightParams = function() {
        const startX = UI_CONFIG.col1Width + 12; 
        const contentW = this.innerWidth - startX; 
        const totalTextHeight = 6 * UI_CONFIG.paramLineH; 
        const startY = (this.innerHeight - totalTextHeight) / 2;

        for (let i = 0; i < 6; i++) {
            const y = startY + i * UI_CONFIG.paramLineH; 
            this.drawOneParam(startX, y, contentW, 2 + i); 
        }
    };

    Window_EquipStatus.prototype.drawOneParam = function(x, y, width, paramId) {
        const wLabel = 84;  
        const wValue = 50;  
        const wArrow = 26;  
        const wNew = width - wLabel - wValue - wArrow; 

        this.resetFontSettings();
        this.contents.fontSize = UI_CONFIG.fontSize.paramLabel;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.param(paramId), x, y, wLabel);

        if (this._actor) {
            this.resetTextColor();
            this.contents.fontSize = UI_CONFIG.fontSize.paramVal;
            this.drawText(this._actor.param(paramId), x + wLabel, y, wValue, "right"); 
        }

        this.changeTextColor(ColorManager.systemColor());
        this.contents.fontSize = 18;          
        this.contents.paintOpacity = 128;     
        this.drawText("▶", x + wLabel + wValue, y, wArrow, "center");
        this.contents.paintOpacity = 255;     

        if (this._tempActor) {
            this.contents.fontSize = UI_CONFIG.fontSize.paramVal;
            const newValue = this._tempActor.param(paramId); 
            const oldValue = this._actor.param(paramId);     
            const diff = newValue - oldValue;                

            this.changeTextColor(ColorManager.paramchangeTextColor(diff));
            this.drawText(newValue, x + wLabel + wValue + wArrow + 16, y, wNew - 4, "left"); 
        }
        
        this.resetFontSettings(); 
    };

    Window_EquipCommand.prototype.itemTextAlign = function() {
        return "center"; 
    };

    // 装备槽垂直居中逻辑（保持不变，它会自动适应新的长窗口）
    const _Window_EquipSlot_itemRect = Window_EquipSlot.prototype.itemRect;
    Window_EquipSlot.prototype.itemRect = function(index) {
        const rect = _Window_EquipSlot_itemRect.call(this, index);
        const maxItems = this.maxItems();
        const itemHeight = this.itemHeight();
        const totalHeight = maxItems * itemHeight;
        const windowHeight = this.innerHeight;
        
        if (totalHeight < windowHeight) {
            const offsetY = Math.floor((windowHeight - totalHeight) / 2);
            rect.y += offsetY; 
        }
        
        return rect; 
    };
})(); 


// 状态窗口适配 854
(() => {

    const STATUS_FONT_SIZE = 21;      
    const STATUS_LINE_HEIGHT = 32;    
    const HEADER_NAME_SIZE = 26;      
    const HEADER_LEVEL_SIZE = 22;      
    const PROFILE_HEIGHT = 85;         
    const EXP_LABEL_SIZE = 20;         
    const EXP_VALUE_SIZE = 24;         
    const EQUIP_ICON_SIZE = 24;        

    Scene_Status.prototype.statusWindowRect = function() {
        const wx = 0;
        const wy = 0; 
        const ww = Graphics.boxWidth;
        const wh = 165; 
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Status.prototype.statusParamsWindowRect = function() {
        const wx = 0;
        const topRect = this.statusWindowRect();
        const wy = topRect.y + topRect.height;
        const ww = Graphics.boxWidth;
        
        const totalAvailableH = Graphics.boxHeight - PROFILE_HEIGHT - topRect.height;
        // [适配854] 保持百分比分配，长屏下参数区会自然拉长，显示更宽松
        const wh = Math.floor(totalAvailableH * 0.52); 
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Status.prototype.statusEquipWindowRect = function() {
        const paramsRect = this.statusParamsWindowRect();
        const topRect = this.statusWindowRect();
        const ww = Graphics.boxWidth;
        const wx = 0;
        const wy = paramsRect.y + paramsRect.height;
        const wh = Graphics.boxHeight - wy - PROFILE_HEIGHT;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Status.prototype.statusParamsWidth = function() {
        return Graphics.boxWidth;
    };

    Scene_Status.prototype.profileHeight = function() {
        return PROFILE_HEIGHT;
    };
    
    Scene_Status.prototype.profileWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.profileHeight();
        const wx = 0;
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    class Sprite_StatusCustomGauge extends Sprite_Gauge {
        constructor() {
            super();
        }

        bitmapWidth() { return 170; } 
        bitmapHeight() { return 30; } 
        gaugeHeight() { return 12; }  

        drawLabel() {
            const iconName = this.gaugeIcon();
            if (!iconName) return;

            const bitmap = ImageManager.loadPicture(iconName);
            const iconX = 4;
            const iconY = 8;
            const iconSize = 12; 

            if (bitmap.width > 0) {
                this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
            } else {
                bitmap.addLoadListener(() => {
                    this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
                });
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

    Window_Status.prototype.refresh = function() {
        this.contents.clear();
        if (this._actor) {
            const faceX = 8;
            const faceY = 8;
            this.drawActorFace(this._actor, faceX, faceY);

            const dataX = 158;
            const dataY = 12;
            const lineHeight = 32;

            this.contents.fontSize = HEADER_NAME_SIZE;
            this.changeTextColor('rgba(255, 215, 0, 1)');
            this.drawText(this._actor.name(), dataX, dataY, 180);

            const levelY = dataY + lineHeight + 2;
            const lvImg = ImageManager.loadPicture("lvicon");
            const lvIconSize = lvImg.width || 24; 

            if (lvImg.width > 0) {
                 this.contents.blt(lvImg, 0, 0, lvImg.width, lvImg.height, dataX, levelY + 2, lvIconSize, lvIconSize);
            } else {
                 lvImg.addLoadListener(() => {
                     this.contents.blt(lvImg, 0, 0, lvImg.width, lvImg.height, dataX, levelY + 2, lvIconSize, lvIconSize);
                 });
            }
            
            this.resetTextColor();
            this.changeTextColor(ColorManager.hpColor(this._actor));
            this.contents.fontSize = HEADER_LEVEL_SIZE;
            this.drawText(this._actor.level, dataX + lvIconSize + 8, levelY - 5, 50);

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

    Window_Status.prototype.gaugeLineHeight = function() {
        return 28; 
    };

    function applyCompactFont(windowObj) {
        windowObj.contents.fontFace = $gameSystem.mainFontFace();
        windowObj.contents.fontSize = STATUS_FONT_SIZE;
        windowObj.resetTextColor();
    }

    Window_StatusParams.prototype.lineHeight = function() {
        return STATUS_LINE_HEIGHT;
    };
    Window_StatusParams.prototype.resetFontSettings = function() {
        applyCompactFont(this);
    };
    Window_StatusParams.prototype.updatePadding = function() {
        this.padding = 10; 
        this._padding = 10;
    };

    Window_StatusEquip.prototype.lineHeight = function() {
        return STATUS_LINE_HEIGHT;
    };
    Window_StatusEquip.prototype.resetFontSettings = function() {
        applyCompactFont(this);
    };
    Window_StatusEquip.prototype.updatePadding = function() {
        this.padding = 10; 
        this._padding = 10;
    };

    Window_StatusEquip.prototype.drawItem = function(index) {
        const slotId = index;
        const actor = this._actor;
        
        if (slotId >= actor.equipSlots().length) return;
        
        const item = actor.equips()[slotId];
        const rect = this.itemLineRect(index);
        
        this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
        
        this.contents.fontSize = STATUS_FONT_SIZE;
        this.changeTextColor(ColorManager.systemColor());
        
        const equipSlotType = actor.equipSlots()[slotId]; 
        const slotTypeName = $dataSystem.equipTypes[equipSlotType] || "未知槽位"; 
        
        const slotName = slotTypeName; 
        
        this.drawText(slotName, rect.x + 4, rect.y + 2, 120, "left");

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

})();

// 存档窗口 (自动适配)
(() => {
    const helpWindowLines = 1;

    Scene_File.prototype.helpWindowRect = function() {
        const wx = 0;
        const wy = 0; 
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(helpWindowLines, false);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_File.prototype.listWindowRect = function() {
        const wx = 0;
        const helpRect = this.helpWindowRect();
        const wy = helpRect.height + helpRect.y; 
        const ww = Graphics.boxWidth;
        // [适配854] 自动填满剩余高度
        const wh = Graphics.boxHeight - wy;

        return new Rectangle(wx, wy, ww, wh);
    };
})();

// 商店界面适配
Scene_Shop.prototype.mainAreaTop = function() {
    return 0;
};

// [适配854] 自动计算高度
Scene_Shop.prototype.mainAreaHeight = function() {
    const helpHeight = this.calcWindowHeight(1, true); 
    return Graphics.boxHeight - this.mainAreaTop() - helpHeight;
};

Scene_Shop.prototype.mainCommandWidth = function() {
    return 180;
};

Scene_Shop.prototype.statusWidth = function() {
    return 180;
};

// 调整帮助窗口位置到最下方
Scene_Shop.prototype.createHelpWindow = function() {
    const helpHeight = this.calcWindowHeight(1, true);
    // [适配854] 自动定位到底部
    const rect = new Rectangle(0, Graphics.boxHeight - helpHeight, Graphics.boxWidth, helpHeight);
    this._helpWindow = new Window_Help(rect);
    this.addWindow(this._helpWindow);
};

// 商店按钮缩放逻辑
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

Window_ShopNumber.prototype.buttonSpacing = function() {
    return 6; 
};

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