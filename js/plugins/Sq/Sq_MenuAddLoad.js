/*:
 * @target MZ
 * @plugindesc [UI综合优化] 菜单读档 + 技能/装备/状态/存档/商店界面重构
 * @author 神枪手
 * * @param enableLoadCommand
 * @text 启用菜单读档功能
 * @type boolean
 * @default true
 * @desc 是否在菜单中添加读档选项。true=启用，false=禁用。
 * * @help
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 本插件整合了多个界面优化模块，适配垂直分辨率（如 480x720）：
 * * 1. **主菜单**：
 * - 可选：直接在主菜单添加“读档”指令（仅非战斗时可用）。
 * * 2. **技能界面**：
 * - 调整窗口布局，适配三排技能显示。
 * - 独立的背景故事帮助窗口。
 * - 状态窗口字体和布局美化。
 * * 3. **装备界面**：
 * - 垂直居中的装备槽布局。
 * - 属性对比界面优化（箭头指示、颜色变化）。
 * - 金色名字与大字体适配。
 * * 4. **状态界面**：
 * - 大字体与图标适配。
 * - 经验值显示优化。
 * - 自定义 HP/MP/TP 计量条样式。
 * * 5. **存档/读档界面**：
 * - 移除窗口间隙，实现无缝拼接布局。
 * * 6. **商店界面**：
 * - 按钮自动缩放，防止重叠。
 * - 布局适配窄屏。
 * * ============================================================================
 */

(() => {
    'use strict';

    // 获取插件参数（已修改为匹配当前文件名）
    const pluginParams = PluginManager.parameters('Sq_MenuAddLoad');
    const enableLoadCommand = pluginParams.enableLoadCommand === 'true';

    // 1. 在菜单命令窗口中添加读档选项（添加参数控制）
    const _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
    Window_MenuCommand.prototype.makeCommandList = function() {
        _Window_MenuCommand_makeCommandList.call(this);
        // 关键：同时检查参数和防重复逻辑
        if (enableLoadCommand && !this._list.some(cmd => cmd.symbol === "load")) {
            this.addLoadCommand();
        }
    };

    // 2. 定义添加读档命令的方法
    Window_MenuCommand.prototype.addLoadCommand = function() {
        const enabled = this.isLoadEnabled();
        this.addCommand("读档", "load", enabled);
    };

    // 3. 定义读档命令的启用条件
    Window_MenuCommand.prototype.isLoadEnabled = function() {
        return !$gameParty.inBattle();
    };

    // 4. 处理读档命令的执行逻辑（添加参数控制）
    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        // 仅当启用时才绑定处理函数
        if (enableLoadCommand) {
            this._commandWindow.setHandler("load", this.commandLoad.bind(this));
        }
    };

    // 5. 实现读档命令的处理函数
    Scene_Menu.prototype.commandLoad = function() {
        this._commandWindow.close();
        SceneManager.push(Scene_Load);
    };

})();

// 技能角色选择窗口（保持原全局作用域，位置逻辑与原代码一致）
Window_MenuActor.prototype.initialize = function(rect) {
    // 窗口位置与尺寸：保留原代码的重复赋值逻辑（与原效果一致）
    rect.x = 0;
    rect.y = 0;
    rect.width = 400;
    rect.height = Graphics.height; // 使用全屏高度，不预留触屏区
    rect.height = 500; // 最终高度
    
    Window_MenuStatus.prototype.initialize.call(this, rect);
    this.hide();
};

// ===== 关键修改：为Window_SkillList添加场景判断 =====
// 保存原始的初始化方法
const _original_Window_SkillList_initialize = Window_SkillList.prototype.initialize;
// 重写初始化方法，根据场景判断是否应用自定义尺寸
Window_SkillList.prototype.initialize = function(rect) {
    // 判断当前场景是否为菜单中的技能场景（Scene_Skill）
    if (SceneManager._scene instanceof Scene_Skill) {
        // 仅在菜单技能场景使用你自定义的参数（完全保留你的设置）
        rect.x = 0;        
        rect.y = 170;        
        rect.width = 480;   
        rect.height = 200;  // 三排技能的精准高度（推荐）
        // rect.height = 150; // 或留少量余量的高度
        
        Window_Selectable.prototype.initialize.call(this, rect);
        this._actor = null;
        this._stypeId = 0;
        this._data = [];
    } else {
        // 其他场景（如战斗）调用原始初始化方法，保持默认布局
        _original_Window_SkillList_initialize.call(this, rect);
    }
};

// 这个窗口是角色技能显示头像啊血条蓝条的窗口（保持全局作用域）
function Window_SkillStatus() {
    this.initialize(...arguments);
}

Window_SkillStatus.prototype = Object.create(Window_StatusBase.prototype);
Window_SkillStatus.prototype.constructor = Window_SkillStatus;

// 窗口初始化与布局配置（完全保留原位置参数）
Window_SkillStatus.prototype.initialize = function(rect) {
    // 窗口位置与大小配置（完全保留你的原始值）
    rect.x = 0;                // 窗口X坐标
    rect.y = -5;               // 窗口Y坐标（与原代码一致）
    rect.width = 320;          // 窗口宽度
    rect.height = 180;         // 窗口高度
    
    
    Window_StatusBase.prototype.initialize.call(this, rect);
    this._actor = null;
    
    // 文本大小配置（集中管理便于调整）
    this._nameFontSize = 22;    // 名字字体大小
    this._levelFontSize = 16;   // 等级字体大小
    this._classFontSize = 16;   // 职业字体大小
};

// 设置当前选中角色
Window_SkillStatus.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

// 刷新窗口（只绘制当前选中角色）
Window_SkillStatus.prototype.refresh = function() {
    Window_StatusBase.prototype.refresh.call(this);
    if (this._actor) {
        // 绘制当前选中角色的信息
        this.drawCurrentActorStatus();
    }
};

// 绘制当前选中角色的状态信息（核心样式，保留原位置参数）
Window_SkillStatus.prototype.drawCurrentActorStatus = function() {
    const actor = this._actor;
    if (!actor) return;
    
    // 窗口内边距
    const padding = this.padding;
    const x = 0;
    const y = 0;
    
    // ===== 保留原代码的位置参数 =====
    const faceWidth = 144;      // 头像宽度
    const faceHeight = 144;     // 头像高度
    const nameOffsetX = 140;    // 名字X轴偏移（相对于头像）
    const nameOffsetY = 0;      // 名字Y轴偏移
    const levelOffsetY = 20;    // 等级Y轴偏移
    const classOffsetY = 0;     // 职业Y轴偏移
    const gaugeOffsetY = 30;    // 计量槽Y轴偏移（原代码值）
    const gaugeSpacing = 8;     // 计量槽间距
    
    // 绘制角色头像
    this.drawActorFace(actor, x, y, faceWidth, faceHeight);
    
    // 绘制角色名（金色）
    this.contents.fontSize = this._nameFontSize;
    this.changeTextColor('rgba(255, 223, 0, 1)');
    this.drawText(actor.name(), x + nameOffsetX, y + nameOffsetY, 200);
    
    // 等级文本（HP颜色）
    this.contents.fontSize = this._levelFontSize;
    this.changeTextColor(ColorManager.hpColor(actor));
    this.drawText(`Lv${actor.level}`, x + nameOffsetX, y + levelOffsetY, 80);
    
    // 绘制职业（白色半透明）
    this.contents.fontSize = this._classFontSize;
    this.changeTextColor("rgba(255, 255, 255, 0.8)");
    this.drawText(actor.currentClass().name, x + nameOffsetX + 70, y + classOffsetY, 180);
    
    // 绘制HP/MP计量槽（恢复原代码的计量槽X值和偏移）
    const gaugeX = x + 133;     // 计量槽的x值（原代码）
    const gaugeStartY = y + 45; // 原代码的计量槽起始Y
    
    this.placeGauge(actor, "hp", gaugeX, gaugeStartY);
    this.placeGauge(actor, "mp", gaugeX, gaugeStartY + this.gaugeLineHeight() + gaugeSpacing);
    
    if ($dataSystem.optDisplayTp) {
        this.placeGauge(actor, "tp", gaugeX, gaugeStartY + this.gaugeLineHeight() * 2 + gaugeSpacing * 2);
    }
    
    // 恢复默认字体设置
    this.resetFontSettings();
};

// 自定义计量槽绘制
Window_SkillStatus.prototype.placeGauge = function(actor, type, x, y) {
    const key = `actor${actor.actorId()}-skillgauge-${type}`;
    const sprite = this.createInnerSprite(key, Sprite_MenuGauge);
    sprite.setup(actor, type);
    sprite.move(x, y);
    sprite.show();
};

// 获取计量槽行高
Window_SkillStatus.prototype.gaugeLineHeight = function() {
    return 18; // 可调整计量槽高度
};

// 这是技能类型选择窗口哦（保持原全局作用域和位置参数）
Window_SkillType.prototype.initialize = function(rect) {
    rect.x = 320;        // 左留10px边距（原代码值）
    rect.y = -5;         // 顶部留10px边距（原代码值）
    rect.width = 160;    // 技能类型窗口宽度（适配单列显示）
    rect.height = 180;   // 高度容纳所有技能类型选项
    
    Window_Command.prototype.initialize.call(this, rect);
    this._actor = null;
};

// 精简优化版：技能场景独立帮助窗口（仅显示背景故事，保持全局作用域）
function Window_SkillHelp() {
    this.initialize(...arguments);
}

Window_SkillHelp.prototype = Object.create(Window_Base.prototype);
Window_SkillHelp.prototype.constructor = Window_SkillHelp;

// ===============================
// 🔧 只改这两个数即可控制字体大小
// ===============================
Window_SkillHelp.storyTitleSize = 14;    // 背景故事标题字体（数字）
Window_SkillHelp.storyContentSize = 18;  // 背景故事内容字体（数字）

// 初始化（保留原参数）
Window_SkillHelp.prototype.initialize = function(rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._item = null;
    this.padding = 12;
};

// 🚫 防止字体被系统重置（必须覆盖）
Window_SkillHelp.prototype.resetFontSettings = function() {
    this.contents.fontFace = $gameSystem.mainFontFace();
    this.contents.fontSize = Window_SkillHelp.storyContentSize;
    this.resetTextColor();
};

// 设置内容
Window_SkillHelp.prototype.setItem = function(item) {
    if (this._item !== item) {
        this._item = item;
        this.refresh();
    }
};

// 清空内容
Window_SkillHelp.prototype.clear = function() {
    this.setItem(null);
};

// 绘制内容
Window_SkillHelp.prototype.refresh = function() {
    this.contents.clear();
    if (!this._item) return;

    const story = this._item.meta.skillStory || this._item.meta.itemStory;
    if (!story) return;

    let y = this.padding;

    // ======== 📝 绘制内容 ========
    this.contents.fontSize = Window_SkillHelp.storyContentSize;
    this.changeTextColor("#e6c510");
    this.drawTextEx(story, this.padding, y, this.contents.width - this.padding * 2);
};

// 场景中创建窗口（保留原位置参数）
Scene_Skill.prototype.createHelpWindow = function() {
    const wx = 0;
    const wy = 370;
    const ww = 480;
    const wh = 345;
    this._helpWindow = new Window_SkillHelp(new Rectangle(wx, wy, ww, wh));
    this.addWindow(this._helpWindow);
};

// 技能列表联动
const _Window_SkillList_updateHelp = Window_SkillList.prototype.updateHelp;
Window_SkillList.prototype.updateHelp = function() {
    if (SceneManager._scene instanceof Scene_Skill && this._helpWindow) {
        this._helpWindow.setItem(this.item());
    } else {
        _Window_SkillList_updateHelp.call(this);
    }
};

// 初始化清空
const _Scene_Skill_start = Scene_Skill.prototype.start;
Scene_Skill.prototype.start = function() {
    _Scene_Skill_start.call(this);
    this._helpWindow?.clear();
};
// 立即执行函数：隔离作用域，避免变量污染全局命名空间
(() => {
    // ============================================================
    // 1. 场景布局配置 (适配 480x720分辨率)
    // 定义装备界面各UI元素的尺寸参数，便于统一管理和调整
    // ============================================================
    
    const UI_CONFIG = {
        statusH: 230,       // 角色状态窗口的高度
        cmdH: 70,           // 指令选择窗口的高度
        faceSize: 144,      // 角色头像的尺寸（宽高）
        col1Width: 154,     // 状态窗口左侧栏（头像区）总宽度
        paramLineH: 32,     // 属性行的高度
        fontSize: {         // 各文本的字号配置
            name: 24,       // 角色名字号
            level: 18,      // 等级字号
            paramLabel: 22, // 属性标签（如"攻击力"）字号
            paramVal: 24    // 属性数值字号
        }
    };

    // 重写：状态窗口（角色信息区）的位置和大小计算
    Scene_Equip.prototype.statusWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, UI_CONFIG.statusH);
    };

    // 重写：指令窗口（"装备"/"卸下"等）的位置和大小计算
    Scene_Equip.prototype.commandWindowRect = function() {
        const sRect = this.statusWindowRect();
        return new Rectangle(0, sRect.height, Graphics.boxWidth, UI_CONFIG.cmdH);
    };

    // 重写：帮助窗口（提示文本区）的位置和大小计算
    Scene_Equip.prototype.helpWindowRect = function() {
        const wh = this.calcWindowHeight(2, false); // 计算2行文本的窗口高度
        return new Rectangle(0, Graphics.boxHeight - wh, Graphics.boxWidth, wh);
    };

    // 重写：装备槽窗口（部位选择区）的位置和大小计算
    Scene_Equip.prototype.slotWindowRect = function() {
        const cRect = this.commandWindowRect();
        const hRect = this.helpWindowRect();
        // 位于指令窗口下方、帮助窗口上方的区域
        return new Rectangle(0, cRect.y + cRect.height, Graphics.boxWidth, hRect.y - (cRect.y + cRect.height));
    };
    
    // 重写：物品列表窗口（装备选择区）的位置和大小计算（与装备槽窗口重合）
    Scene_Equip.prototype.itemWindowRect = function() {
        return this.slotWindowRect();
    };

    // ============================================================
    // 2. 状态窗口绘制逻辑修改 (Window_EquipStatus)
    // 自定义角色状态窗口的显示样式，包括头像、名称、等级和属性参数
    // ============================================================

    // 保存原始初始化方法（钩子模式，避免覆盖原逻辑）
    const _Window_EquipStatus_initialize = Window_EquipStatus.prototype.initialize;
    // 重写初始化方法：扩展状态窗口的初始化逻辑
    Window_EquipStatus.prototype.initialize = function(rect) {
        _Window_EquipStatus_initialize.call(this, rect); // 执行原始初始化
        this._actor = null;       // 当前显示的角色对象
        this._tempActor = null;   // 装备变更后的临时角色（用于预览属性变化）
        this.refresh();           // 立即刷新窗口内容
    };

    // 刷新窗口内容：清空画布并重新绘制所有元素
    Window_EquipStatus.prototype.refresh = function() {
        this.contents.clear();
        if (this._actor) { // 仅当存在角色对象时绘制
            this.drawLeftArea();   // 绘制左侧头像/名称/等级区
            this.drawDivider();    // 绘制左右区域分隔线
            this.drawRightParams();// 绘制右侧属性参数区
        }
    };

    // 绘制左侧区域：头像、角色名、等级
    Window_EquipStatus.prototype.drawLeftArea = function() {
        const faceY = 0; 
        this.drawActorFace(this._actor, 0, faceY); // 绘制角色头像

        const nameY = UI_CONFIG.faceSize + 4; // 角色名Y坐标（头像下方+间距）
        this.resetFontSettings();             // 重置字体设置为默认
        this.contents.fontSize = UI_CONFIG.fontSize.name; // 设置角色名字号
        
        // 角色名使用金色（RGBA指定）
        this.changeTextColor('rgba(255, 223, 0, 1)'); 
        this.drawText(this._actor.name(), 0, nameY, UI_CONFIG.faceSize, 'center'); // 居中绘制角色名

        const levelY = nameY + 28; // 等级Y坐标（角色名下方+间距）
        this.contents.fontSize = UI_CONFIG.fontSize.level; // 设置等级字号
        this.changeTextColor(ColorManager.systemColor()); // 使用系统默认颜色
        this.drawText(TextManager.levelA + " " + this._actor.level, 0, levelY, UI_CONFIG.faceSize, 'center'); // 绘制等级
    };

    // 绘制左右区域的分隔线
    Window_EquipStatus.prototype.drawDivider = function() {
        const x = UI_CONFIG.col1Width; // 分隔线X坐标（左侧栏宽度处）
        const h = this.innerHeight;    // 窗口内部高度
        this.contents.paintOpacity = 60; // 设置透明度（半透明）
        this.contents.fillRect(x, 10, 1, h - 20, ColorManager.normalColor()); // 绘制1px宽的分隔线
        this.contents.paintOpacity = 255; // 恢复不透明度
    };

    // 绘制右侧属性参数区域：6个核心属性（HP、MP、攻击力等）
    Window_EquipStatus.prototype.drawRightParams = function() {
        const startX = UI_CONFIG.col1Width + 12; // 属性区起始X坐标（分隔线右侧+间距）
        const contentW = this.innerWidth - startX; // 属性区总宽度
        const totalTextHeight = 6 * UI_CONFIG.paramLineH; // 6行属性的总高度
        // 计算属性区垂直居中的起始Y坐标
        const startY = (this.innerHeight - totalTextHeight) / 2;

        // 循环绘制6个属性（paramId从2开始：2=HP,3=MP,4=攻击力,5=防御力,6=敏捷,7=智力）
        for (let i = 0; i < 6; i++) {
            const y = startY + i * UI_CONFIG.paramLineH; // 每行属性的Y坐标
            this.drawOneParam(startX, y, contentW, 2 + i); // 绘制单个属性项
        }
    };

    // 绘制单个属性项：标签、当前值、箭头、预览值（装备变更后）
    Window_EquipStatus.prototype.drawOneParam = function(x, y, width, paramId) {
        const wLabel = 84;  // 属性标签宽度（如"攻击力"）
        const wValue = 50;  // 当前属性值宽度
        const wArrow = 26;  // 箭头图标宽度
        const wNew = width - wLabel - wValue - wArrow; // 预览属性值宽度

        // 绘制属性标签
        this.resetFontSettings();
        this.contents.fontSize = UI_CONFIG.fontSize.paramLabel;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.param(paramId), x, y, wLabel);

        // 绘制当前属性值
        if (this._actor) {
            this.resetTextColor();
            this.contents.fontSize = UI_CONFIG.fontSize.paramVal;
            this.drawText(this._actor.param(paramId), x + wLabel, y, wValue, "right"); // 右对齐
        }

        // 绘制箭头（用于分隔当前值和预览值）
        this.changeTextColor(ColorManager.systemColor());
        this.contents.fontSize = 18;          
        this.contents.paintOpacity = 128;     // 半透明
        this.drawText("▶", x + wLabel + wValue, y, wArrow, "center");
        this.contents.paintOpacity = 255;     

        // 绘制装备变更后的预览属性值（带颜色区分增减）
        if (this._tempActor) {
            this.contents.fontSize = UI_CONFIG.fontSize.paramVal;
            const newValue = this._tempActor.param(paramId); // 新属性值
            const oldValue = this._actor.param(paramId);     // 旧属性值
            const diff = newValue - oldValue;                // 属性变化量

            // 根据变化量设置颜色（增加=红色，减少=蓝色，不变=默认）
            this.changeTextColor(ColorManager.paramchangeTextColor(diff));
            this.drawText(newValue, x + wLabel + wValue + wArrow + 16, y, wNew - 4, "left"); // 左对齐
        }
        
        this.resetFontSettings(); // 重置字体设置
    };

    // ============================================================
    // 3. 指令窗口样式修改 (Window_EquipCommand)
    // 调整指令窗口中文字的对齐方式
    // ============================================================
    Window_EquipCommand.prototype.itemTextAlign = function() {
        return "center"; // 指令文字改为居中对齐（默认左对齐）
    };

    // ============================================================
    // 4. 核心修改：装备槽窗口布局优化 (Window_EquipSlot)
    // 实现装备槽选项的垂直居中显示，提升界面美观度
    // ============================================================
    
    // 保存原始itemRect方法（用于获取默认的矩形位置）
    const _Window_EquipSlot_itemRect = Window_EquipSlot.prototype.itemRect;
    // 重写itemRect方法：计算装备槽选项的位置（实现垂直居中）
    Window_EquipSlot.prototype.itemRect = function(index) {
        // 1. 获取原始方法计算的默认矩形位置
        const rect = _Window_EquipSlot_itemRect.call(this, index);
        
        // 2. 计算装备槽选项的总高度（数量×单选项高度）
        const maxItems = this.maxItems();
        const itemHeight = this.itemHeight();
        const totalHeight = maxItems * itemHeight;
        
        // 3. 获取窗口内部的可视高度
        const windowHeight = this.innerHeight;
        
        // 4. 如果选项总高度小于窗口高度，计算垂直偏移量（实现居中）
        if (totalHeight < windowHeight) {
            const offsetY = Math.floor((windowHeight - totalHeight) / 2);
            rect.y += offsetY; // 向下偏移，使选项整体居中
        }
        
        return rect; // 返回调整后的位置矩形
    };
})(); 


//  这是菜单中的状态窗口
(() => {

    // --- 1. 调整后的基础配置参数 (加大关键字体，优化配合) ---
    const STATUS_FONT_SIZE = 21;       // 属性/装备栏字体（原18→21，更清晰）
    const STATUS_LINE_HEIGHT = 32;     // 属性/装备栏行高（原28→32，适配更大字体）
    const HEADER_NAME_SIZE = 26;       // 顶部名字字体（保持醒目）
    const HEADER_LEVEL_SIZE = 22;      // 顶部等级字体（原20→22，更清晰）
    const PROFILE_HEIGHT = 85;         // 简介窗口高度（略增，避免拥挤）
    const EXP_LABEL_SIZE = 20;         // 经验标签字体（原11→14）
    const EXP_VALUE_SIZE = 24;         // 经验数值字体（原16→19）
    const EQUIP_ICON_SIZE = 24;        // 装备图标大小（原默认→24，配合字体）

    // --- 2. 窗口布局逻辑 (适配字体增大，保持比例) ---

    // 顶部窗口：微调高度，适配等级字体增大
    Scene_Status.prototype.statusWindowRect = function() {
        const wx = 0;
        const wy = 0; 
        const ww = Graphics.boxWidth;
        const wh = 165; // 原160→165，适配经验字体增大
        return new Rectangle(wx, wy, ww, wh);
    };

    // 属性窗口：调整高度分配，适配行高增大
    Scene_Status.prototype.statusParamsWindowRect = function() {
        const wx = 0;
        const topRect = this.statusWindowRect();
        const wy = topRect.y + topRect.height;
        const ww = Graphics.boxWidth;
        
        const totalAvailableH = Graphics.boxHeight - PROFILE_HEIGHT - topRect.height;
        const wh = Math.floor(totalAvailableH * 0.52); // 略降占比，适配装备窗口
        return new Rectangle(wx, wy, ww, wh);
    };

    // 装备窗口：适配图标和字体大小
    Scene_Status.prototype.statusEquipWindowRect = function() {
        const paramsRect = this.statusParamsWindowRect();
        const topRect = this.statusWindowRect();
        const ww = Graphics.boxWidth;
        const wx = 0;
        const wy = paramsRect.y + paramsRect.height;
        const wh = Graphics.boxHeight - wy - PROFILE_HEIGHT;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 强制属性窗口全宽
    Scene_Status.prototype.statusParamsWidth = function() {
        return Graphics.boxWidth;
    };

    // 简介窗口：略增高度，避免文字拥挤
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

    // --- 3. 自定义计量条 (适配经验区域字体增大) ---
    class Sprite_StatusCustomGauge extends Sprite_Gauge {
        constructor() {
            super();
        }

        bitmapWidth() { return 170; } // 原150→145，给经验值更多空间
        bitmapHeight() { return 30; } // 原30→32，适配整体布局
        gaugeHeight() { return 12; }  // 原12→13，更醒目

        // 图标标签优化（增大图标，配合字体）
        drawLabel() {
            const iconName = this.gaugeIcon();
            if (!iconName) return;

            const bitmap = ImageManager.loadPicture(iconName);
            const iconX = 4;
            const iconY = 8;
            const iconSize = 12; // 原18→20，图标更大，配合字体

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

        // 数值显示优化（保持清晰，配合整体）
        drawValue() {
            const currentValue = this.currentValue();
            const currentMaxValue = this.currentMaxValue();
            const width = this.bitmapWidth();
            const height = this.textHeight();

            let str = `/${currentMaxValue}`;
            let maxValueWidth = this.bitmap.measureTextWidth(str);

            this.bitmap.textColor = "rgba(255, 255, 255, 1)";
            this.bitmap.fontSize = 18; // 保持清晰
            this.bitmap.drawText(currentValue, 0, -2, width - maxValueWidth + 2, height, "right");
            
            this.bitmap.textColor = "rgba(255, 255, 255, 0.8)";
            this.bitmap.fontSize = 12;
            this.bitmap.drawText(str, width - maxValueWidth, 0, maxValueWidth, height, "right");
        }
    }

    // --- 4. 顶部窗口绘制逻辑 (加大经验字体，优化布局) ---
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
            // 头像位置微调
            const faceX = 8;
            const faceY = 8;
            this.drawActorFace(this._actor, faceX, faceY);

            // 右侧数据区位置优化
            const dataX = 158;
            const dataY = 12;
            const lineHeight = 32;

            // 名字绘制（保持金色醒目）
            this.contents.fontSize = HEADER_NAME_SIZE;
            this.changeTextColor('rgba(255, 215, 0, 1)');
            this.drawText(this._actor.name(), dataX, dataY, 180);

            // 等级区域（加大字体，优化位置）
            const levelY = dataY + lineHeight + 2;
            const lvImg = ImageManager.loadPicture("lvicon");
            const lvIconSize = lvImg.width || 24; // 等级图标增大

            if (lvImg.width > 0) {
                 this.contents.blt(lvImg, 0, 0, lvImg.width, lvImg.height, dataX, levelY + 2, lvIconSize, lvIconSize);
            } else {
                 lvImg.addLoadListener(() => {
                     this.contents.blt(lvImg, 0, 0, lvImg.width, lvImg.height, dataX, levelY + 2, lvIconSize, lvIconSize);
                 });
            }
            
            // 等级数值（加大字体）
            this.resetTextColor();
            this.changeTextColor(ColorManager.hpColor(this._actor));
            this.contents.fontSize = HEADER_LEVEL_SIZE;
            this.drawText(this._actor.level, dataX + lvIconSize + 8, levelY - 5, 50);

            // 职业名称（加大字体，更清晰）
            this.contents.fontSize = 17; // 原15→17
            this.changeTextColor("rgba(255, 255, 255, 0.9)");
            this.drawText(this._actor.currentClass().name, dataX + 80, levelY - 5, 120);

            // 计量条区域（适配经验字体增大）
            let gaugeY = levelY + 32; // 原30→32，留出更多空间
            const gaugeSpacing = this.gaugeLineHeight() + 2;

            // HP计量条+当前经验
            this.placeGauge(this._actor, "hp", dataX, gaugeY);
            this.drawExpInfo(dataX + 155, gaugeY - 4, "current"); // 调整位置，避免重叠
            
            gaugeY += gaugeSpacing;
            
            // MP计量条+升级经验
            this.placeGauge(this._actor, "mp", dataX, gaugeY);
            this.drawExpInfo(dataX + 155, gaugeY - 100, "next"); // 调整位置
            
            gaugeY += gaugeSpacing;

            if ($dataSystem.optDisplayTp) {
                this.placeGauge(this._actor, "tp", dataX, gaugeY);
            }
        }
    };

    // 经验值绘制（加大字体，优化样式）
    Window_Status.prototype.drawExpInfo = function(x, y, type) {
        const width = 120; // 加宽绘制区域
        
        // 经验标签（加大字体，更醒目）
        this.contents.fontSize = EXP_LABEL_SIZE;
        this.changeTextColor(ColorManager.systemColor());
        
        let label = "";
        let value = "";
        
        if (type === "current") {
            label = TextManager.expA; // "Exp"
            value = this._actor.currentExp();
        } else {
            label = "升级所需";
            value = this._actor.isMaxLevel() ? "已满级" : this._actor.nextRequiredExp();
        }

        // 标签绘制（优化位置）
        this.drawText(label, x, y - 2, width, "right");

        // 经验数值（大幅加大，核心反馈）
        this.contents.fontSize = EXP_VALUE_SIZE;
        this.changeTextColor(ColorManager.normalColor());
        
        // 数值绘制（优化位置，避免拥挤）
        this.drawText(value, x, y + 20, width, "right");
    };

    // 计量条行高优化（适配整体布局）
    Window_Status.prototype.gaugeLineHeight = function() {
        return 28; // 原26→28，适配计量条高度
    };

    // --- 5. 属性与装备窗口优化 (核心调整：字体+图标配合) ---
    function applyCompactFont(windowObj) {
        windowObj.contents.fontFace = $gameSystem.mainFontFace();
        windowObj.contents.fontSize = STATUS_FONT_SIZE;
        windowObj.resetTextColor();
    }

    // 属性窗口优化
    Window_StatusParams.prototype.lineHeight = function() {
        return STATUS_LINE_HEIGHT;
    };
    Window_StatusParams.prototype.resetFontSettings = function() {
        applyCompactFont(this);
    };
    Window_StatusParams.prototype.updatePadding = function() {
        this.padding = 10; // 原8→10，适配更大字体
        this._padding = 10;
    };

    // 装备窗口优化（重点：图标与文字配合）
    Window_StatusEquip.prototype.lineHeight = function() {
        return STATUS_LINE_HEIGHT;
    };
    Window_StatusEquip.prototype.resetFontSettings = function() {
        applyCompactFont(this);
    };
    Window_StatusEquip.prototype.updatePadding = function() {
        this.padding = 10; // 原8→10，适配更大字体
        this._padding = 10;
    };

    // 装备窗口优化（重点：修复undefined问题）
Window_StatusEquip.prototype.drawItem = function(index) {
    const slotId = index;
    const actor = this._actor;
    
    // 安全校验：如果超出装备槽数量则跳过
    if (slotId >= actor.equipSlots().length) return;
    
    const item = actor.equips()[slotId];
    const rect = this.itemLineRect(index);
    
    this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
    
    // 1. 绘制装备槽名称（修复undefined问题）
    this.contents.fontSize = STATUS_FONT_SIZE;
    this.changeTextColor(ColorManager.systemColor());
    
    // 获取装备槽类型名称（增加安全处理）
    const equipSlotType = actor.equipSlots()[slotId]; // 获取角色实际装备槽类型ID
    const slotTypeName = $dataSystem.equipTypes[equipSlotType] || "未知槽位"; // 安全获取名称
    
    // 正确的装备槽名称（如：武器、防具）
    const slotName = slotTypeName; // 直接使用装备槽类型名称，避免拼接错误
    
    this.drawText(slotName, rect.x + 4, rect.y + 2, 120, "left");

    // 2. 绘制装备图标（中间位置，增大尺寸）
    const iconX = rect.x + 130;
    const iconY = rect.y + (rect.height - EQUIP_ICON_SIZE) / 2;
    if (item) {
        this.drawIcon(item.iconIndex, iconX, iconY, EQUIP_ICON_SIZE);
    }

    // 3. 绘制装备名称（图标右侧，加大字体）
    this.changeTextColor(ColorManager.normalColor());
    const nameX = iconX + EQUIP_ICON_SIZE + 10;
    const nameWidth = rect.width - nameX + rect.x - 10;
    if (item) {
        this.drawText(item.name, nameX, rect.y + 2, nameWidth, "left");
    } else {
        this.drawText(TextManager.none || "无", nameX, rect.y + 2, nameWidth, "left"); // 安全处理
    }
};

    // 辅助方法：自定义图标绘制（支持指定大小）
    Window_StatusEquip.prototype.drawIcon = function(iconIndex, x, y, size = 24) {
        const bitmap = ImageManager.loadSystem("IconSet");
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size);
    };

})();
//存档窗口
(() => {
    // 1. 配置：上方提示窗口想要显示几行文字？
    // 默认为 1 行。如果你想变高，可以改成 2 或更多。
    const helpWindowLines = 1;

    // 重写帮助窗口（上方提示）的大小和位置
    Scene_File.prototype.helpWindowRect = function() {
        const wx = 0;
        const wy = 0; // 强制 Y=0，顶住屏幕最上方
        const ww = Graphics.boxWidth;
        // 计算高度：根据行数自动计算，第二个参数 false 表示不含填充
        const wh = this.calcWindowHeight(helpWindowLines, false);
        
        return new Rectangle(wx, wy, ww, wh);
    };

    // 重写列表窗口（下方存档列表）的大小和位置
    Scene_File.prototype.listWindowRect = function() {
        const wx = 0;
        
        // 关键点：将 Y 坐标设置为帮助窗口的高度。
        // 这样它们就会无缝连接，中间没有 1 像素的缝隙。
        // 我们重新计算一次帮助窗口的 Rect 来获取它的准确高度。
        const helpRect = this.helpWindowRect();
        const wy = helpRect.height + helpRect.y; 
        
        const ww = Graphics.boxWidth;
        
        // 计算高度：屏幕总高度 - 上方窗口占用的高度
        // 这样下方窗口会自动延伸到底部
        const wh = Graphics.boxHeight - wy;

        return new Rectangle(wx, wy, ww, wh);
    };
})();



// 重写mainAreaTop，移除顶部5像素预留
Scene_Shop.prototype.mainAreaTop = function() {
    return 0;
};

// 适配720高度的主区域高度计算（减去下方帮助窗口高度）
Scene_Shop.prototype.mainAreaHeight = function() {
    const helpHeight = this.calcWindowHeight(1, true); // 帮助窗口高度
    return Graphics.boxHeight - this.mainAreaTop() - helpHeight;
};

// 适配480宽度的命令窗口宽度
Scene_Shop.prototype.mainCommandWidth = function() {
    return 180;
};

// 适配480宽度的状态栏宽度
Scene_Shop.prototype.statusWidth = function() {
    return 180;
};

// 调整帮助窗口位置到最下方
Scene_Shop.prototype.createHelpWindow = function() {
    const helpHeight = this.calcWindowHeight(1, true);
    const rect = new Rectangle(0, Graphics.boxHeight - helpHeight, Graphics.boxWidth, helpHeight);
    this._helpWindow = new Window_Help(rect);
    this.addWindow(this._helpWindow);
};



// 通过统一缩放按钮尺寸解决重叠问题
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
    return 6; // 保持合理间距
};

Window_ShopNumber.prototype.placeButtons = function() {
    const sp = this.buttonSpacing();
    const availableWidth = this.innerWidth - 16; // 左右各留8像素边距
    
    // 计算原始总宽度（按钮宽度+间距）
    const originalTotalWidth = this._buttons.reduce((r, button) => r + button.width + sp, -sp);
    
    // 计算需要的缩放比例
    let scaleFactor = 1;
    if (originalTotalWidth > availableWidth) {
        scaleFactor = availableWidth / originalTotalWidth; // 按比例缩放
        scaleFactor = Math.max(scaleFactor, 0.7); // 最小缩放到70%，避免太小
    }
    
    let x = (this.innerWidth - (originalTotalWidth * scaleFactor)) / 2; // 重新计算起始位置
    
    for (const button of this._buttons) {
        button.x = x;
        button.y = this.buttonY();
        // 统一缩放所有按钮
        button.scale.x = button.scale.y = scaleFactor;
        // 更新x坐标（基于缩放后的宽度）
        x += (button.width * scaleFactor) + sp;
    }
};

// 恢复原始的按钮垂直位置
Window_ShopNumber.prototype.buttonY = function() {
    return Math.floor(this.totalPriceY() + this.lineHeight() * 2);
};

// 确保总价位置计算正确
Window_ShopNumber.prototype.totalPriceY = function() {
    return Math.floor(this.itemNameY() + this.lineHeight() * 2);
};

Window_ShopNumber.prototype.itemNameY = function() {
    return Math.floor(this.innerHeight / 2 - this.lineHeight() * 1.5);
};