/*:
 * @target MZ
 * @plugindesc 模拟崩铁物品菜单 可以写小作文
 * @author 神枪手
 * @version 1.1
 * * @param Max Columns (Item Scene)
 * @text 物品场景最大列数
 * @desc 背包页面显示的列数（其他页面仍为2列）
 * @type number
 * @min 1
 * @max 6
 * @default 3
 * * @param Row Spacing
 * @text 行间距
 * @desc 物品场景的行间距（其他页面为4）
 * @type number
 * @min 0
 * @max 20
 * @default 10
 * * @param Detail Window Width
 * @text 详细窗口宽度
 * @desc 右侧物品详情窗口的宽度
 * @type number
 * @min 100
 * @max 300
 * @default 180
 * * @param Item Name Font Size
 * @text 物品名称字体大小
 * @desc 详情窗口中物品名称的字体大小
 * @type number
 * @min 12
 * @max 24
 * @default 18
 * * @param Item Desc Font Size
 * @text 物品描述字体大小
 * @desc 详情窗口中物品描述的字体大小
 * @type number
 * @min 10
 * @max 20
 * @default 16
 * * @param Item Story Font Size
 * @text 物品故事字体大小
 * @desc 详情窗口中物品故事的字体大小
 * @type number
 * @min 10
 * @max 18
 * @default 14
 * * @param Big Icon Display Size
 * @text 大图标显示尺寸
 * @desc 自定义大图标的显示宽高（正方形）
 * @type number
 * @min 50
 * @max 120
 * @default 80
 * * @param Help Window Name Font Size
 * @text 帮助窗口名称字体大小
 * @desc 顶部帮助窗口中物品名称的字体大小
 * @type number
 * @min 16
 * @max 24
 * @default 18
 * * @param Help Window Desc Font Size
 * @text 帮助窗口描述字体大小
 * @desc 顶部帮助窗口中物品描述的字体大小
 * @type number
 * @min 12
 * @max 20
 * @default 16
 * * @help
 * ============================================================================
 * 物品栏格子化布局插件使用说明
 * ============================================================================
 * * 1. 功能说明：
 * - 仅对背包场景（Scene_Item）生效，其他场景保持默认样式。
 * - 支持自定义物品格子列数、间距、窗口尺寸。
 * - 支持物品自定义大图标和故事文本显示。
 * * 2. 物品标签添加方法（在数据库物品的「备注」栏中填写）：
 * - 自定义大图标：<bigIconName:图标文件名> 
 * （无需扩展名，图片放在 img/icons/ 目录下）
 * 示例：<bigIconName:sword_legend>
 * * - 物品故事文本：<itemStory:故事内容>
 * 示例：<itemStory:这是勇者传承的圣剑，蕴含着远古的力量>
 * * 3. 参数调整：
 * - 在插件管理器中可直接修改列数、间距、字体大小等参数，无需修改代码。
 * * 4. 注意事项：
 * - 大图标建议使用正方形图片（如100x100像素），确保显示效果。
 * - 详细窗口宽度建议根据游戏分辨率调整（480宽度建议180）。
 * * ============================================================================
 */

// 获取插件参数 (已修改为读取当前文件名参数)
const ItemGridConfig = PluginManager.parameters('Sq_item');
const PARAMS = {
    maxCols: Number(ItemGridConfig['Max Columns (Item Scene)'] || 3),
    rowSpacing: Number(ItemGridConfig['Row Spacing'] || 10),
    detailWindowWidth: Number(ItemGridConfig['Detail Window Width'] || 180),
    nameFontSize: Number(ItemGridConfig['Item Name Font Size'] || 18),
    descFontSize: Number(ItemGridConfig['Item Desc Font Size'] || 16),
    storyFontSize: Number(ItemGridConfig['Item Story Font Size'] || 14),
    bigIconSize: Number(ItemGridConfig['Big Icon Display Size'] || 80),
    helpNameFontSize: Number(ItemGridConfig['Help Window Name Font Size'] || 18),
    helpDescFontSize: Number(ItemGridConfig['Help Window Desc Font Size'] || 16)
};

// 加强条件，仅针对背包的页面做格子，其它页面无效
Window_ItemList.prototype.plusCondition = function() {
    return SceneManager._scene instanceof Scene_Item
};

// 最大列（适配配置参数）
Window_ItemList.prototype.maxCols = function() {
    return this.plusCondition() ? PARAMS.maxCols : 2;
};

// 项目高度
Window_ItemList.prototype.itemHeight = function() {
    return this.plusCondition() ? this.itemWidth() : Window_Selectable.prototype.itemHeight.call(this);
};

// 行间距（适配配置参数）
Window_ItemList.prototype.rowSpacing = function() {
    return this.plusCondition() ? PARAMS.rowSpacing : 4;
};

// 项目绘制
const _Window_ItemList_drawItem = Window_ItemList.prototype.drawItem;
Window_ItemList.prototype.drawItem = function(index) {
    if (!this.plusCondition()) {
       return _Window_ItemList_drawItem.call(this, index);
    }
    const item = this.itemAt(index);
    if (item) {
        const rect = this.itemRect(index);
        this.changePaintOpacity(this.isEnabled(item));

        const iconX = rect.x;
        const iconY = rect.y;

        const bigIconName = item.meta.bigIconName;
        const folder = "img/icons/";
        if(bigIconName) {
            const bitmap = ImageManager.loadBitmap(folder, bigIconName);
            const sx = 0;
            const sy = 0;
            // 使用图片实际尺寸，避免拉伸错误
            const pw = bitmap.isReady() ? bitmap.width : 100;
            const ph = bitmap.isReady() ? bitmap.height : 100;
            const dx = rect.x;
            const dy = rect.y;
            const dw = rect.width;
            const dh = rect.height;
            
            if(!bitmap.isReady()) {
                // 替换setTimeout为loadListener，解决作用域和异步覆盖问题
                bitmap.addLoadListener(() => {
                    this.redrawItem(index); // 加载完成后重绘当前项
                });
            } else {
                this.contents.blt(bitmap, sx, sy, pw, ph, dx, dy, dw, dh);
            }    
        } else {
            this.drawIcon(item.iconIndex, iconX, iconY);
        }
        
        // 绘制数量（确保在图标之后，避免被覆盖）
        this.drawItemNumber(item, rect.x, rect.y, rect.width);
        this.changePaintOpacity(1);
    }
};

// 绘制物品数量（调整位置，避免被大图标覆盖）
Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
    if (this.needsNumber()) {
        // 格子布局时，数量绘制在格子底部（避免被图标覆盖）
        const numberY = this.plusCondition() ? y + this.itemHeight() - 30 : y;
        
        if(!this.plusCondition()){
            this.drawText(":", x, numberY, width - this.textWidth("00"), "right");
        }
        this.drawText($gameParty.numItems(item), x, numberY, width, "right");
    }
};

// 更新帮助窗口内容
Window_ItemList.prototype.updateHelp = function() {
    this.setHelpWindowItem(this.item());
};

// 设置帮助窗口项目
Window_ItemList.prototype.setHelpWindowItem = function(item) {
    if (this._helpWindow) {
        this._helpWindow.setItem(item);
    }
};

// 设置物品信息（适配配置参数）
Window_Help.prototype.setItem = function(item) {
    const plusCondition = SceneManager._scene instanceof Scene_Item;
    if(item && plusCondition) {
        const itemName = item.name || "";
        const itemDesc = item.description || "";
        // 使用配置的字体大小
        this.setText(`\\C[2]\\FS[${PARAMS.helpNameFontSize}]${itemName}\\FS[${PARAMS.helpDescFontSize}]\n\\C[0]${itemDesc}`);
    } else {
        this.setText(item ? (item.description || "") : "");
    }
};

/** 适配窗口布局调整（使用配置参数） */

// 列表窗口矩形
Scene_Item.prototype.itemWindowRect = function () {
    const wx = 0;
    const wy = this._categoryWindow.y + this._categoryWindow.height;
    const ww = Graphics.boxWidth - PARAMS.detailWindowWidth;
    const wh = this.mainAreaBottom() - wy + this.calcWindowHeight(2, false);
    return new Rectangle(wx, wy, ww, wh);
};

// 详细说明窗口矩形
Scene_Item.prototype.itemDetailWindowRect = function () {
    const wx = Graphics.boxWidth - PARAMS.detailWindowWidth;
    const wy = this._categoryWindow.y + this._categoryWindow.height;
    const ww = PARAMS.detailWindowWidth;
    const wh = this.mainAreaBottom() - wy + this.calcWindowHeight(2, false);
    return new Rectangle(wx, wy, ww, wh);
};

// 创建详细说明窗口
Scene_Item.prototype.createItemDetailWindow = function () {
    const rect = this.itemDetailWindowRect();
    this._detailWindow = new Window_ItemDetail(rect);
    this.addWindow(this._detailWindow);
};

// 道具场景-创建
Scene_Item.prototype.create = function () {
    Scene_ItemBase.prototype.create.call(this);
    this.createHelpWindow();
    this.createCategoryWindow();
    this.createItemDetailWindow();
    this.createItemWindow();
    this.createActorWindow();
};

// 取消道具选择
Scene_Item.prototype.onItemCancel = function() {
    if (this._categoryWindow.needsSelection()) {
        this._itemWindow.deselect();
        this._categoryWindow.activate();
        this._detailWindow.clear();
    } else {
        this.popScene();
    }
};

// 自定义的详细说明窗口类（适配配置参数）
class Window_ItemDetail extends Window_Scrollable {
    constructor(rect) {
        super(rect);
        this._detailHeight = 0;
    }

    // 设置数据（使用配置参数）
    setItem(item) {
        if(item) {
            const itemStory = item.meta.itemStory || ""; // 空值保护
            this.contents.fontSize = PARAMS.descFontSize;
            this._detailHeight = this.textSizeEx(itemStory).height + 140;
        } else {
            this._detailHeight = 0; // 无物品时重置高度
        }
        this.destroyContents();
        this.createContents();
        this.refresh(item);
    }

    clear() {
        this.contents.clear();
        this._detailHeight = 0;
    }

    // 刷新绘制（适配配置参数）
    refresh(item) {
        this.contents.clear();
        this._scrollY = 0;

        if (item) {
            // 渐变背景高度
            this.contents.gradientFillRect(0, 0, this.innerWidth, 80, "#384A64", "#417E80", false);
            
            const rect = new Rectangle(0, 0, PARAMS.bigIconSize, PARAMS.bigIconSize);
            const iconX = rect.x;
            const iconY = rect.y;
            const bigIconName = item.meta.bigIconName;
            const folder = "img/icons/";
            if (bigIconName) {
                const bitmap = ImageManager.loadBitmap(folder, bigIconName);
                const sx = 0;
                const sy = 0;
                const pw = 100;
                const ph = 100;
                const dx = iconX + 80;
                const dy = iconY;
                const dw = PARAMS.bigIconSize;
                const dh = PARAMS.bigIconSize;
                
                const drawIcon = () => {
                    if (this.contents) { // 确保窗口内容存在
                        this.contents.blt(bitmap, sx, sy, pw, ph, dx, dy, dw, dh);
                    }
                };
                
                if (!bitmap.isReady()) {
                    bitmap.addLoadListener(drawIcon); // 使用loadListener替代setTimeout
                } else {
                    drawIcon();
                }
            } else {
                this.drawIcon(item.iconIndex, iconX + 50, iconY);
            }

            // 使用配置的字体大小
            this.contents.fontSize = PARAMS.nameFontSize;
            this.contents.textColor = "rgba(255,255,255,1)";
            this.drawText(item.name || "", 10, 5, this.innerWidth, "left");

            this.contents.fontSize = PARAMS.descFontSize;
            this.drawText(`×${$gameParty.numItems(item)}`, 10, 40, this.innerWidth, "left");

            const itemDesc = item.description || ""; // 空值保护
            this.contents.fontSize = PARAMS.descFontSize;
            this.drawTextEx(itemDesc, 0, rect.height + 4, this.innerWidth);

            const itemStory = item.meta.itemStory || ""; // 空值保护
            if(itemStory) {
                this.contents.fontSize = PARAMS.storyFontSize;
                this.contents.textColor = "rgba(255,255,255,0.8)";
                this.drawTextEx(itemStory, 0 ,rect.height + 50, this.innerWidth);
            }
        }
    }
    
    drawTextEx(text, x, y, width) {
        text = text || ""; // 空值保护
        const textState = this.createTextState(text, x, y, width);
        this.processAllText(textState);
        return textState.outputWidth;
    }

    textSizeEx(text) {
        text = text || ""; // 关键修复：确保text不为undefined
        const textState = this.createTextState(text, 0, 0, 0);
        textState.drawing = false;
        this.processAllText(textState);
        return { width: textState.outputWidth, height: textState.outputHeight };
    }

    itemHeight() {
        return 80;
    }

    contentsHeight() {
        return this._detailHeight;
    }

    overallHeight() {
        return this._detailHeight;
    }

    scrollBlockHeight() {
        return this._detailHeight;
    }
}

// 列表选择
Window_ItemList.prototype.select = function(index) {
    this._index = index;
    this.refreshCursor();
    this.callUpdateHelp();
    this.callItemDetail();
};

// 召唤道具详细说明窗口
Window_ItemList.prototype.callItemDetail = function() {
    if (this.active && this._detailWindow) {
        this._detailWindow.setItem(this.item());
    }
};

// 创建道具列表窗口
Scene_Item.prototype.createItemWindow = function() {
    const rect = this.itemWindowRect();
    this._itemWindow = new Window_ItemList(rect);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
    this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
    this.addWindow(this._itemWindow);
    this._categoryWindow.setItemWindow(this._itemWindow);
    if (!this._categoryWindow.needsSelection()) {
        this._itemWindow.y -= this._categoryWindow.height;
        this._itemWindow.height += this._categoryWindow.height;
        this._itemWindow.createContents();
        this._categoryWindow.update();
        this._categoryWindow.hide();
        this._categoryWindow.deactivate();
        this.onCategoryOk();
    }
    this._itemWindow.setDetailWindow(this._detailWindow);
};

// 设置详细说明窗口
Window_ItemList.prototype.setDetailWindow = function(detailWindow) {
    this._detailWindow = detailWindow;
};

//顶部选择栏窗口
Scene_Item.prototype.categoryWindowRect = function() {
    const wx = 0;
    const wy = 0; // 帮助窗口下方
    const ww = Graphics.boxWidth;
    const wh = 80; // 1行高度
    return new Rectangle(wx, wy, ww, wh);
};