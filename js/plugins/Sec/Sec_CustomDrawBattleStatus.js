/*:
 * @target MZ
 * @plugindesc 战斗状态栏优化：自适应脸图 + 自定义图标 + 实时刷新 + 独立状态图层 + 窗口与图标位置全自定义
 * @author Secmon (Modified for SuperFrontViewMZ TP Control & Position)
 * @version 1.7.1 (Crash Fix)
 *
 * @param NameFontSize
 * @text 名字字体大小
 * @type number
 * @default 26
 *
 * @param NamePadding
 * @text 名字内边距
 * @desc 名字距离脸图左边缘的水平内边距
 * @type number
 * @default 6
 *
 * @param NameExtraOffsetY
 * @text 名字额外下偏移
 * @desc 在左下角基础上额外向下偏移的像素
 * @type number
 * @default 11
 *
 * @param FaceScale
 * @text 头像缩放比例
 * @desc 调整头像的大小（0.8表示80%，1.0表示原大小）
 * @type number
 * @decimals 2
 * @default 1.00
 *
 * @param FaceOffsetY
 * @text 头像Y轴微调
 * @desc 调整头像的垂直位置（正数向下，负数向上）
 * @type number
 * @default 0
 *
 * @param ShowTpGauge
 * @text 是否显示TP条
 * @desc true显示，false隐藏
 * @type boolean
 * @default true
 *
 * @param GaugeHeight
 * @text 进度条高度
 * @type number
 * @default 8
 *
 * @param GaugePadding
 * @text 进度条内边距
 * @type number
 * @default 1
 *
 * @param ValueAreaWidth
 * @text 数值区域宽度
 * @type number
 * @default 90
 *
 * @param HpGaugeColor
 * @text HP进度条颜色
 * @type string
 * @default #fffdb0
 *
 * @param MpGaugeColor
 * @text MP进度条颜色
 * @type string
 * @default #61c3d0
 *
 * @param TpGaugeColor
 * @text TP进度条颜色
 * @type string
 * @default #55DD55
 *
 * @param ---State Icons---
 * @default
 *
 * @param StateIconSize
 * @text 状态图标尺寸
 * @parent ---State Icons---
 * @type number
 * @default 24
 *
 * @param StateMaxCount
 * @text 最大状态数量
 * @parent ---State Icons---
 * @type number
 * @default 4
 *
 * @param StateSpacing
 * @text 状态图标间距
 * @parent ---State Icons---
 * @type number
 * @default 2
 *
 * @param StateIconOffsetX
 * @text 状态图标X偏移
 * @parent ---State Icons---
 * @desc 调整状态图标相对于头像右上角的水平位置（支持负数）
 * @type number
 * @min -9999
 * @default 0
 *
 * @param StateIconOffsetY
 * @text 状态图标Y偏移
 * @parent ---State Icons---
 * @desc 调整状态图标相对于头像顶部的垂直位置（支持负数）
 * @type number
 * @min -9999
 * @default 0
 *
 * @param ---Window Customization---
 * @default
 *
 * @param EnableCustomWindow
 * @text 启用窗口位置自定义
 * @parent ---Window Customization---
 * @desc 是否启用下方的窗口位置和大小设置？
 * @type boolean
 * @default false
 *
 * @param WindowX
 * @text 窗口 X 坐标
 * @parent ---Window Customization---
 * @desc 窗口左上角的 X 坐标 (支持负数)
 * @type number
 * @min -9999
 * @default 0
 *
 * @param WindowY
 * @text 窗口 Y 坐标
 * @parent ---Window Customization---
 * @desc 窗口左上角的 Y 坐标 (支持负数)
 * @type number
 * @min -9999
 * @default 450
 *
 * @param WindowWidth
 * @text 窗口宽度
 * @parent ---Window Customization---
 * @desc 窗口宽度 (设为 0 则保持默认宽度)
 * @type number
 * @default 0
 *
 * @param WindowHeight
 * @text 窗口高度
 * @parent ---Window Customization---
 * @desc 窗口高度 (设为 0 则保持默认高度)
 * @type number
 * @default 0
 *
 * @help
 * ============================================================================
 * 崩溃修复 (1.7.1)
 * ============================================================================
 * 1. 【紧急修复】修复了在没有战斗背景或初始化过快时可能导致的
 * "Cannot read property '0' of undefined" 报错。
 * 加入了多重安全检查，确保插件稳定运行。
 *
 * ============================================================================
 * 图标位置修复 (1.7.0)
 * ============================================================================
 * 1. 【新增参数】StateIconOffsetX 和 StateIconOffsetY。
 * 现在你可以精确控制状态图标（红心/中毒等图标）的位置了。
 * 如果你想让图标往下移，增大 StateIconOffsetY 的数值即可。
 *
 * ============================================================================
 * 位置调整更新 (1.6.0)
 * ============================================================================
 * 1. 【新增功能】现在可以在插件参数中自定义战斗状态窗口的 X, Y, 宽, 高。
 * 请先将 "启用窗口位置自定义" 设置为 true。
 *
 * ============================================================================
 */

(() => {
    // 读取当前文件名对应的参数
    const parameters = PluginManager.parameters('Sec_CustomDrawBattleStatus');
    
    // 原有参数
    const nameFontSize = Number(parameters['NameFontSize'] || 26);
    const namePadding = Number(parameters['NamePadding'] || 6);
    const nameExtraOffsetY = Number(parameters['NameExtraOffsetY'] || 11);
    const gaugeHeight = Number(parameters['GaugeHeight'] || 8);
    const gaugePadding = Number(parameters['GaugePadding'] || 1);
    const valueAreaWidth = Number(parameters['ValueAreaWidth'] || 90);
    
    const FACE_SCALE = Number(parameters['FaceScale'] || 1.00);
    const FACE_OFFSET_Y = Number(parameters['FaceOffsetY'] || 0);
    const SHOW_TP_GAUGE = parameters['ShowTpGauge'] === "true"; 

    const HP_GAUGE_COLOR = parameters['HpGaugeColor'] || "#fffdb0";
    const MP_GAUGE_COLOR = parameters['MpGaugeColor'] || "#61c3d0";
    const TP_GAUGE_COLOR = parameters['TpGaugeColor'] || "#55DD55";

    const ICON_SIZE = 10;
    const ROW_SPACING = 10;

    // 状态图标参数
    const STATE_ICON_SIZE = Number(parameters['StateIconSize'] || 24);
    const STATE_MAX_COUNT = Number(parameters['StateMaxCount'] || 4);
    const STATE_SPACING = Number(parameters['StateSpacing'] || 5);
    // 新增：图标偏移参数
    const STATE_ICON_OFFSET_X = Number(parameters['StateIconOffsetX'] || 0);
    const STATE_ICON_OFFSET_Y = Number(parameters['StateIconOffsetY'] || 0);

    // 窗口位置参数
    const ENABLE_CUSTOM_WINDOW = parameters['EnableCustomWindow'] === "true";
    const CUSTOM_WIN_X = Number(parameters['WindowX'] || 0);
    const CUSTOM_WIN_Y = Number(parameters['WindowY'] || 0);
    const CUSTOM_WIN_W = Number(parameters['WindowWidth'] || 0);
    const CUSTOM_WIN_H = Number(parameters['WindowHeight'] || 0);

    const hpIconBitmap = ImageManager.loadBitmap("img/rainbow/", "hpicon");
    const mpIconBitmap = ImageManager.loadBitmap("img/rainbow/", "mpicon");
    const tpIconBitmap = ImageManager.loadBitmap("img/rainbow/", "tpicon");

    // ========================================================================
    //  Scene_Battle 扩展：自定义窗口矩形
    // ========================================================================
    const _Scene_Battle_statusWindowRect = Scene_Battle.prototype.statusWindowRect;
    Scene_Battle.prototype.statusWindowRect = function() {
        const rect = _Scene_Battle_statusWindowRect.call(this);
        
        if (ENABLE_CUSTOM_WINDOW) {
            rect.x = CUSTOM_WIN_X;
            rect.y = CUSTOM_WIN_Y;
            if (CUSTOM_WIN_W > 0) rect.width = CUSTOM_WIN_W;
            if (CUSTOM_WIN_H > 0) rect.height = CUSTOM_WIN_H;
        }
        
        return rect;
    };

    // ========================================================================
    //  Window_BattleStatus 逻辑
    // ========================================================================

    const _Window_BattleStatus_initialize = Window_BattleStatus.prototype.initialize;
    Window_BattleStatus.prototype.initialize = function(rect) {
        _Window_BattleStatus_initialize.call(this, rect);
        this._stateIconSprites = []; 
    };

    Window_BattleStatus.prototype.drawCustomIcon = function(bitmap, x, y, size) {
        if (!bitmap.isReady()) return;
        this.contents.blt(bitmap, 0, 0, bitmap.width, bitmap.height, x, y, size, size);
    };

    // 【修改点】更新独立的图标Sprite（加入防崩溃逻辑）
    Window_BattleStatus.prototype.updateActorStateSprite = function(index, actor, x, y, faceSize) {
        // -----------------------------------------------------------------
        // 1. 安全初始化：如果容器数组都没建好，立刻创建一个
        // -----------------------------------------------------------------
        if (!this._stateIconSprites) {
            this._stateIconSprites = [];
        }

        // -----------------------------------------------------------------
        // 2. 安全创建：如果对应位置没有 Sprite，新建一个并加入显示列表
        // -----------------------------------------------------------------
        if (!this._stateIconSprites[index]) {
            const newSprite = new Sprite();
            // 确保 addChild 存在（极少数情况下可能会报错，虽然几率很小）
            if (this.addChild) {
                this.addChild(newSprite);
            }
            this._stateIconSprites[index] = newSprite;
        }

        const sprite = this._stateIconSprites[index];
        
        // -----------------------------------------------------------------
        // 3. 终极防线：如果 sprite 依然是空的，绝对不能往下执行
        //    （这里就是解决 "read property '0' of undefined" 的关键）
        // -----------------------------------------------------------------
        if (!sprite) return;

        // 正常逻辑：如果没有角色，隐藏图标并退出
        if (!actor) {
            sprite.visible = false;
            return;
        }

        // --- 以下为原有绘制逻辑，保持不变 ---
        const states = actor.states().filter(state => state.iconIndex > 0);
        const displayCount = Math.min(states.length, STATE_MAX_COUNT);
        
        const totalWidth = STATE_MAX_COUNT * (STATE_ICON_SIZE + STATE_SPACING);
        const totalHeight = STATE_ICON_SIZE;

        // 确保 bitmap 存在
        if (!sprite.bitmap || sprite.bitmap.width < totalWidth) {
            sprite.bitmap = new Bitmap(totalWidth, totalHeight);
        }
        sprite.bitmap.clear();

        for (let i = 0; i < displayCount; i++) {
            const state = states[i];
            const iconIndex = state.iconIndex;
            const pw = ImageManager.iconWidth;
            const ph = ImageManager.iconHeight;
            const sx = (iconIndex % 16) * pw;
            const sy = Math.floor(iconIndex / 16) * ph;
            const dx = i * (STATE_ICON_SIZE + STATE_SPACING);
            const bitmap = ImageManager.loadSystem("IconSet");
            sprite.bitmap.blt(bitmap, sx, sy, pw, ph, dx, 0, STATE_ICON_SIZE, STATE_ICON_SIZE);
        }

        const stateRealWidth = displayCount * (STATE_ICON_SIZE + STATE_SPACING) - STATE_SPACING;
        
        // 计算坐标
        const targetX = x + faceSize - stateRealWidth + STATE_ICON_OFFSET_X;
        const targetY = y + STATE_ICON_OFFSET_Y;

        sprite.x = Math.max(x, targetX);
        sprite.y = targetY;
        sprite.visible = true;
        sprite.z = 10; 
    };

    Window_BattleStatus.prototype.drawItem = function(index) {
        const actor = $gameParty.members()[index];
        // 如果角色不存在，尝试隐藏图标（前提是图标已创建）
        if (!actor) {
            if (this._stateIconSprites && this._stateIconSprites[index]) {
                this._stateIconSprites[index].visible = false;
            }
            return;
        }

        const rect = this.itemRect(index);
        let x = rect.x;
        let y = rect.y;
        const width = rect.width;
        
        // 1. 应用头像缩放
        const rawFaceSize = width;
        const faceSize = Math.floor(rawFaceSize * FACE_SCALE);
        const offsetX = Math.floor((rawFaceSize - faceSize) / 2);
        const finalX = x + offsetX;
        const finalY = y + FACE_OFFSET_Y;

        const valueFontSize = Math.max(15, Math.floor(ICON_SIZE * 1.2));
        const valueHeight = valueFontSize + 4;

        // 2. SuperFrontViewMZ 动态同步
        let isSuperFVActive = false;
        if (this._additionalSprites && this._additionalSprites["sv_actor%1".format(index)]) {
            const sprite = this._additionalSprites["sv_actor%1".format(index)];
            sprite.updateFrame = function() {}; // 禁止自动裁剪

            const pw = ImageManager.faceWidth || 144;
            const ph = ImageManager.faceHeight || 144;
            const faceIndex = actor.faceIndex();
            const sx = Math.floor((faceIndex % 4) * pw);
            const sy = Math.floor(Math.floor(faceIndex / 4) * ph);

            if (sprite._mainSprite && sprite._mainSprite.bitmap) {
                sprite._mainSprite.setFrame(sx, sy, pw, ph);
                sprite.setFrame(0, 0, pw, ph);
            }

            const scaleRatio = faceSize / pw;
            const sign = Math.sign(sprite.scale.x) || 1; 
            
            sprite.scale.x = scaleRatio * sign;
            sprite.scale.y = scaleRatio;
            sprite.setHome(finalX + faceSize / 2, finalY + faceSize);
            sprite.show();
            isSuperFVActive = true;
        }

        if (!isSuperFVActive) {
            this.drawActorFace(actor, finalX, finalY, faceSize, faceSize);
        }

        // 3. 绘制独立图层状态图标 (传入位置供计算)
        this.updateActorStateSprite(index, actor, finalX, finalY, faceSize);

        // 4. 绘制名字
        const nameX = x + namePadding;
        const nameY = finalY + faceSize - this.lineHeight() - namePadding + nameExtraOffsetY;

        const originalFontSize = this.contents.fontSize;
        this.contents.fontSize = nameFontSize;
        const nameColor = actor.isDead() ? "#AAAAAA" : "#FFFFFF";

        const offsets = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
        offsets.forEach(([dx, dy]) => {
            this.drawText(actor.name(), nameX + dx, nameY + dy, width, "left");
        });
        this.contents.textColor = nameColor;
        this.drawText(actor.name(), nameX, nameY, width, "left");
        this.contents.fontSize = originalFontSize;

        // 绘制条形图
        const faceBottom = finalY + faceSize;
        const nameBottom = nameY + this.lineHeight();
        let contentBottomY = Math.max(faceBottom, nameBottom) + 4;

        const drawStatusRow = (iconBitmap, valueText, rate, gaugeColor) => {
            this.drawColoredGauge(x, contentBottomY, width, rate, gaugeColor);
            const iconY = contentBottomY - ICON_SIZE;
            this.drawCustomIcon(iconBitmap, x, iconY, ICON_SIZE);
            
            const valueY = contentBottomY - valueHeight;
            const valueX = x + width - valueAreaWidth - 2;
            const origFS = this.contents.fontSize;
            this.contents.fontSize = valueFontSize;
            this.contents.textColor = "#FFFFFF";
            this.drawText(valueText, valueX, valueY, valueAreaWidth, "right");
            this.contents.fontSize = origFS;
            contentBottomY += gaugeHeight + ROW_SPACING;
        };

        // HP 和 MP 总是绘制
        drawStatusRow(hpIconBitmap, `${actor.hp}/${actor.mhp}`, actor.hpRate(), HP_GAUGE_COLOR);
        drawStatusRow(mpIconBitmap, `${actor.mp}/${actor.mmp}`, actor.mpRate(), MP_GAUGE_COLOR);
        
        // TP 根据参数控制绘制
        if (SHOW_TP_GAUGE) {
            drawStatusRow(tpIconBitmap, `${actor.tp}/${actor.maxTp()}`, actor.tpRate(), TP_GAUGE_COLOR);
        }
    };

    Window_BattleStatus.prototype.drawColoredGauge = function(x, y, width, rate, color) {
        const height = gaugeHeight;
        const padding = gaugePadding;
        const innerWidth = Math.floor((width - padding * 2) * rate);
        const innerHeight = height - padding * 2;

        this.contents.fillRect(x + padding, y + padding, width - padding * 2, innerHeight, ColorManager.gaugeBackColor());
        if (innerWidth > 0) {
            this.contents.fillRect(x + padding, y + padding, innerWidth, innerHeight, color);
        }
    };

    const _Window_BattleStatus_update = Window_BattleStatus.prototype.update;
    Window_BattleStatus.prototype.update = function() {
        _Window_BattleStatus_update.call(this);
        if (SceneManager._scene instanceof Scene_Battle) {
            this.refresh();
        }
    };
})();