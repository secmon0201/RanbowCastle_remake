/*:
 * @target MZ
 * @plugindesc [系统] 480x854分辨率适配 & 菜单全屏背景 & 计量槽重绘
 * @author 神枪手
 *
 * @help
 * ============================================================================
 * 功能介绍
 * ============================================================================
 * 本插件用于美化 RPG Maker MZ 的主菜单界面，具体包含以下修改：
 *
 * 1. **背景美化**：
 * - 替换默认背景为自定义图片 "Main" (img/pictures/Main.png)。
 *
 * 2. **窗口布局调整** (适配 480x720 分辨率)：
 * - 命令窗口：左上角，宽140，高380。
 * - 状态窗口：右侧，宽340，高720，单列显示。
 * - 金币窗口：左下角，宽144，高70。
 *
 * 3. **角色状态绘制优化**：
 * - **脸图**：根据队伍人数动态等分高度，确保排版整齐。
 * - **名字/等级**：调整坐标，使用金色名字，等级显示图标 (img/pictures/lvicon.png)。
 * - **计量槽 (HP/MP/TP)**：
 * - 使用自定义 Sprite 绘制。
 * - 标签替换为图标 (hpicon, mpicon, tpicon)。
 * - 数值样式优化 (大号当前值 + 小号最大值)。
 *
 * 4. **资源预加载**：
 * - 自动预加载所需的图标资源。
 *
 * ============================================================================
 * 图片资源需求 (存放于 img/pictures/)
 * ============================================================================
 * - Main.png    (菜单背景图)
 * - hpicon.png  (HP 图标)
 * - mpicon.png  (MP 图标)
 * - tpicon.png  (TP 图标)
 * - lvicon.png  (等级图标)
 *
 * ============================================================================
 */

// 读取系统图片
Scene_Boot.prototype.loadSystemImages = function() {
    ColorManager.loadWindowskin();
    ImageManager.loadSystem("IconSet");
    // 需要提前加载
    ImageManager.loadPicture("hpicon");
    ImageManager.loadPicture("mpicon");
    ImageManager.loadPicture("lvicon");
};

// 标题画面启动（注释部分保留你的原始代码）
//Scene_Title.prototype.start = function() {
    //Scene_Base.prototype.start.call(this);
    //SceneManager.clearStack();
    //this.adjustBackground();
    //this.playTitleMusic();
    //this.startFadeIn(this.fadeSpeed(), false);

    // 跳转到菜单页面，不用直接注释
   // SceneManager.goto(Scene_Menu);
//};

Scene_MenuBase.prototype.createBackground = function() {
    this._backgroundSprite = new Sprite();
    const bitmap = ImageManager.loadPicture("Main"); // 修正方法名
    this._backgroundSprite.bitmap = bitmap; // 修正拼写错误
    this.addChild(this._backgroundSprite); // 修正方法名
};

//↓这是菜单命令窗口
Scene_Menu.prototype.commandWindowRect = function() {
    const ww = 140;
    // 修改高度：原 380 + (3行 x 36px) ≈ 490
    // 这样可以多显示约 3 个命令，且在 854 高度的屏幕中左侧也不会太拥挤
    const wh = 490; 
    const wx = 0;
    const wy = -5;
    return new Rectangle(wx, wy, ww, wh);
};

//↓这是状态窗口 (修改：高度改为 854)
Scene_Menu.prototype.statusWindowRect = function() {
    const ww = 340;
    const wh = 854; // 修正：由 720 改为 854 以填满新分辨率的高度
    const wx = 140;
    const wy = -5;
    return new Rectangle(wx, wy, ww, wh);
};

// 核心：设置角色等比分布的布局参数（动态适配角色数量）
Window_MenuStatus.prototype.maxCols = function () {
    return 1; // 保持单列布局
};

// 1. 固定显示行数为4（告诉窗口这里总是按4行来排版）
Window_MenuStatus.prototype.numVisibleRows = function() {
    return 4; 
};

Window_MenuStatus.prototype.itemHeight = function() {
    const contentHeight = this.height - this.padding * 2;
    // 无论有几个人，都按4等分计算高度
    return Math.floor(contentHeight / 4);
};

// 动态设置最大项目数：等于实际角色数量（避免访问不存在的角色）
Window_MenuStatus.prototype.maxItems = function() {
    return $gameParty.members().length;
};

Window_MenuStatus.prototype.drawItemStatus = function(index) {
    const actor = this.actor(index);
    // 关键：添加角色存在性检查，避免报错
    if (!actor) return;
    
    const rect = this.itemRect(index); // 当前角色项的矩形区域（x,y,width,height）
    const itemHeight = rect.height;    // 每个角色项的高度（已等分）
    
    // 基于itemRect的相对定位（不再用固定+360）
    // 角色名：垂直居中偏上，水平左对齐
    const nameY = rect.y + (itemHeight / 4); 
    // 等级：角色名右侧，垂直对齐角色名
    const levelY = nameY;
    // 职业：角色名下方，垂直居中偏下
    const classY = nameY + 30; 

    const lineHeight = this.lineHeight();

    // 角色名
    this.contents.fontSize = 22;
    this.changeTextColor('rgba(255, 223, 0, 1)');
    this.drawText(actor.name(), rect.x + 150, nameY -30, 144);

    // 等级
    const img = ImageManager.loadPicture("lvicon"); // 加载图片（文件名不含后缀）
    const x = rect.x + 150; // 图片X坐标（和原文本位置一致）
    const y = levelY + 4;   // 图片Y坐标（和原文本位置一致）
    const pw = img.width;   // 图片宽度（自动获取）
    const ph = img.height;  // 图片高度（自动获取）
    // 绘制图片：参数（图片, 图片内X, 图片内Y, 图片宽, 图片高, 目标X, 目标Y, 目标宽, 目标高）
    this.contents.blt(img, 0, 0, pw, ph, x, y, pw, ph); 
    this.resetTextColor();
    //等级文本
    this.contents.fontSize = 16;
    this.changeTextColor(ColorManager.hpColor(actor));
    this.drawText(actor.level, rect.x + 153, levelY -7, 36, "right");
    
    // 职业：保留你原始的坐标设置
    this.contents.fontSize = 16;
    this.changeTextColor("rgba(255, 255, 255, 0.8)");
    this.drawText(actor.currentClass().name, rect.x + 1800, classY, 14400);

    // 计量槽
    this.placeGauge(actor, "hp", x - 10, y + 20);
    this.placeGauge(actor, "mp", x - 10, y + 20 + this.gaugeLineHeight() + 6);
    if ($dataSystem.optDisplayTp) {
        this.placeGauge(actor, "tp", x + 16, y + 86 + this.gaugeLineHeight() * 2 + 12);
    }
};

//========================================
//  菜单状态窗口 - 计量槽放置
//========================================
Window_MenuStatus.prototype.placeGauge = function(actor, type, x, y) {
    const key = `actor${actor.actorId()}-gauge-${type}`;
    const sprite = this.createInnerSprite(key, Sprite_MenuGauge);
    sprite.setup(actor, type);
    sprite.move(x, y);
    sprite.show();
};

//========================================
//  自定义菜单计量槽类（支持图标标签）
//========================================
class Sprite_MenuGauge extends Sprite_Gauge {
    constructor() {
        super();
    }

    // 🔧 计量条宽高配置可按需改
    bitmapWidth() { return 150; }
    bitmapHeight() { return 32; }
    gaugeHeight() { return 8; }

    //========================================
    //  🔥 覆盖标签绘制 —— 改成绘图标
    //========================================
    drawLabel() {
        const iconName = this.gaugeIcon();
        if (!iconName) return;

        const bitmap = ImageManager.loadPicture(iconName);

        const iconX = 10;  // 📌 图标 X（可自行调整）
        const iconY = 14;  // 📌 图标 Y（可自行调整）
        const iconSize = 10; // 📌 绘制大小（建议16~20）

        // 🔍 确保图片已加载再绘制
        if (bitmap.width > 0) {
            this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
        } else {
            bitmap.addLoadListener(() => {
                this.bitmap.blt(bitmap, 0, 0, bitmap.width, bitmap.height, iconX, iconY, iconSize, iconSize);
            });
        }
    }

    //========================================
    //  ⬅️ 根据类型返回不同图标
    //========================================
    gaugeIcon() {
        switch (this._statusType) {
            case "hp": return "hpicon";  // 对应 img/pictures/hp_icon.png
            case "mp": return "mpicon";
            case "tp": return "tpicon";
            default: return null;
        }
    }

    //========================================
    //  🔮 数值绘制（保留原版 + 你自定义格式）
    //========================================
    drawValue() {
        const currentValue = this.currentValue();
        const currentMaxValue = this.currentMaxValue();
        const width = this.bitmapWidth();
        const height = this.textHeight();

        // 计算最大值宽度
        let str = `/${currentMaxValue}`;
        let maxValueWidth = this.bitmap.measureTextWidth(str);

        // 当前值
        this.bitmap.textColor = "rgba(255, 255, 255, 1)";
        this.bitmap.fontSize = 18;
        this.bitmap.drawText(currentValue, 0, -3, width - maxValueWidth + 4, height, "right");
        
        // /最大值
        this.bitmap.textColor = "rgba(255, 255, 255, 0.8)";
        this.bitmap.fontSize = 12;
        this.bitmap.drawText(`/${currentMaxValue}`, width - maxValueWidth, -1, maxValueWidth, height, "right");
    }
}

// 金币窗口矩形 (修改：Y坐标适配 854 高度)
Scene_Menu.prototype.goldWindowRect = function() {
    const ww = 144;    
    const wh = 70;     
    const wx = 0;      
    // 修正：计算底部坐标 (屏幕高度 854 - 窗口高度 70 - 底部留白 5)
    // 之前的 715 大约是 720-5，所以这里用 854-5 = 849
    const wy = 854 - wh - 5; 
    return new Rectangle(wx, wy, ww, wh);
};

Window_Gold.prototype.refresh = function() {
    const rect = this.itemLineRect(0);
    this.contents.clear();
    
    // 保存默认字号，设置单位字号（这里改为18，可调整）
    const oldSize = this.contents.fontSize;
    this.contents.fontSize = 20; // 货币单位的大小
    
    // 绘制金币显示
    this.drawCurrencyValue(this.value(), this.currencyUnit(), rect.x, rect.y, rect.width);
    
    // 恢复默认字号
    this.contents.fontSize = oldSize;
};