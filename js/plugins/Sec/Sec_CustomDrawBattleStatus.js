/*:
 * @target MZ
 * @plugindesc [战斗] 自适应状态栏 & 独立图标图层 & 自定义窗口布局 (SuperFV 完美显示修复版)
 * @author Secmon (Modified for SuperFrontViewMZ)
 * @version 2.6 (Full Face Fix)
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
 * @param ---Buffer Visuals---
 * @text [缓冲条颜色]
 * @default
 * @param BufferColorDamage
 * @text 扣血缓冲色
 * @parent ---Buffer Visuals---
 * @desc 扣血/蓝时残留的缓冲条颜色(支持Hex或rgba)
 * @default #FFFFFF
 * @param BufferColorHeal
 * @text 回血高亮色
 * @parent ---Buffer Visuals---
 * @desc 回血/蓝时预显示的底色(支持Hex或rgba)
 * @default #FFD700
 *
 * @help
 * ============================================================================
 * Sec_CustomDrawBattleStatus.js (v2.6)
 * ============================================================================
 * 更新日志 v2.6:
 * 彻底修复了 SuperFrontViewMZ 脸图显示不全（左右被裁切）的问题。
 * * 原理：
 * 此时插件会注入一段特殊的代码，强制让 SuperFV 使用完整的脸图尺寸(144x144)，
 * 而不再受限于系统默认的窗口格子宽度。
 * * 同时保留了受击震动效果（Shake）。
 * ============================================================================
 */

(() => {
    const parameters = PluginManager.parameters('Sec_CustomDrawBattleStatus');
    
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

    const STATE_ICON_SIZE = Number(parameters['StateIconSize'] || 24);
    const STATE_MAX_COUNT = Number(parameters['StateMaxCount'] || 4);
    const STATE_SPACING = Number(parameters['StateSpacing'] || 5);
    const STATE_ICON_OFFSET_X = Number(parameters['StateIconOffsetX'] || 0);
    const STATE_ICON_OFFSET_Y = Number(parameters['StateIconOffsetY'] || 0);

    const ENABLE_CUSTOM_WINDOW = parameters['EnableCustomWindow'] === "true";
    const CUSTOM_WIN_X = Number(parameters['WindowX'] || 0);
    const CUSTOM_WIN_Y = Number(parameters['WindowY'] || 0);
    const CUSTOM_WIN_W = Number(parameters['WindowWidth'] || 0);
    const CUSTOM_WIN_H = Number(parameters['WindowHeight'] || 0);

    const BUFFER_COLOR_DAMAGE = parameters['BufferColorDamage'] || "#FFFFFF";
    const BUFFER_COLOR_HEAL = parameters['BufferColorHeal'] || "#FFD700";

    const hpIconBitmap = ImageManager.loadBitmap("img/rainbow/", "hpicon");
    const mpIconBitmap = ImageManager.loadBitmap("img/rainbow/", "mpicon");
    const tpIconBitmap = ImageManager.loadBitmap("img/rainbow/", "tpicon");

    // ========================================================================
    //  Game_Battler 缓冲逻辑
    // ========================================================================
    const _Game_Battler_initMembers = Game_Battler.prototype.initMembers;
    Game_Battler.prototype.initMembers = function() {
        _Game_Battler_initMembers.call(this);
        this._hpBuffer = 0;
        this._mpBuffer = 0;
        this._gaugeBufferInitialized = false;
    };

    Game_Battler.prototype.checkGaugeBufferInit = function() {
        if (!this._gaugeBufferInitialized) {
            this._hpBuffer = this.hp;
            this._mpBuffer = this.mp;
            this._gaugeBufferInitialized = true;
        }
    };

    Game_Battler.prototype.updateGaugeBuffers = function() {
        this.checkGaugeBufferInit();
        this._hpBuffer = this.updateSingleBuffer(this._hpBuffer, this.hp, this.mhp);
        this._mpBuffer = this.updateSingleBuffer(this._mpBuffer, this.mp, this.mmp);
    };

    Game_Battler.prototype.updateSingleBuffer = function(bufferVal, realVal, maxVal) {
        if (bufferVal === realVal) return bufferVal;
        const diff = Math.abs(bufferVal - realVal);
        let speed = Math.max(diff / 10, maxVal / 120, 1);
        if (bufferVal > realVal) {
            return Math.max(bufferVal - speed, realVal);
        } else {
            return Math.min(bufferVal + speed, realVal);
        }
    };

    Game_Battler.prototype.hpBufferRate = function() {
        this.checkGaugeBufferInit();
        return this.mhp > 0 ? this._hpBuffer / this.mhp : 0;
    };
    Game_Battler.prototype.mpBufferRate = function() {
        this.checkGaugeBufferInit();
        return this.mmp > 0 ? this._mpBuffer / this.mmp : 0;
    };

    // ========================================================================
    //  Scene_Battle 窗口位置
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
    //  Window_BattleStatus 绘制逻辑
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

    Window_BattleStatus.prototype.updateActorStateSprite = function(index, actor, x, y, faceSize) {
        if (!this._stateIconSprites) this._stateIconSprites = [];
        if (!this._stateIconSprites[index]) {
            const newSprite = new Sprite();
            if (this.addChild) this.addChild(newSprite);
            this._stateIconSprites[index] = newSprite;
        }

        const sprite = this._stateIconSprites[index];
        if (!sprite) return; 

        if (!actor) {
            sprite.visible = false;
            return;
        }

        const states = actor.states().filter(state => state.iconIndex > 0);
        const displayCount = Math.min(states.length, STATE_MAX_COUNT);
        
        const totalWidth = STATE_MAX_COUNT * (STATE_ICON_SIZE + STATE_SPACING);
        const totalHeight = STATE_ICON_SIZE;

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
        const targetX = x + faceSize - stateRealWidth + STATE_ICON_OFFSET_X;
        const targetY = y + STATE_ICON_OFFSET_Y;

        sprite.x = Math.max(x, targetX);
        sprite.y = targetY;
        sprite.visible = true;
        sprite.z = 10; 
    };

    Window_BattleStatus.prototype.drawItem = function(index) {
        const actor = $gameParty.members()[index];
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
        
        const rawFaceSize = width;
        const faceSize = Math.floor(rawFaceSize * FACE_SCALE);
        const offsetX = Math.floor((rawFaceSize - faceSize) / 2);
        const finalX = x + offsetX;
        const finalY = y + FACE_OFFSET_Y;

        const valueFontSize = Math.max(15, Math.floor(ICON_SIZE * 1.2));
        const valueHeight = valueFontSize + 4;

        // --- SuperFrontViewMZ 兼容性 & 裁切修复 ---
        let isSuperFVActive = false;
        if (this._additionalSprites && this._additionalSprites["sv_actor%1".format(index)]) {
            const sprite = this._additionalSprites["sv_actor%1".format(index)];

            // 【关键修复代码 Start】
            // 我们重写这个精灵的 updateFrame 方法。
            // 目的：强制它使用完整的脸图尺寸 (ImageManager.faceWidth)，而不是去读取窗口的格子宽度。
            // 这样就解决了“左右显示不全”的问题。
            sprite.updateFrame = function() {
                // 1. 调用父类方法，确保基础逻辑（如Bitmap加载）正常运行
                Sprite_Battler.prototype.updateFrame.call(this);
                
                const bitmap = this._mainSprite.bitmap;
                if (bitmap) {
                    // 获取标准脸图尺寸 (通常是 144x144)
                    const pw = ImageManager.faceWidth;
                    const ph = ImageManager.faceHeight;
                    const faceIndex = this._actor.faceIndex();
                    
                    // 计算该脸图在合集中的坐标
                    const sx = Math.floor((faceIndex % 4) * pw);
                    const sy = Math.floor(Math.floor(faceIndex / 4) * ph);
                    
                    // 强制设置 Frame 为完整大小，忽略 Window 的限制
                    this._mainSprite.setFrame(sx, sy, pw, ph);
                    // 本身的 frame 也设为满大小
                    this.setFrame(0, 0, pw, ph);
                }
            };
            // 【关键修复代码 End】

            const targetHomeX = finalX + faceSize / 2;
            const targetHomeY = finalY + faceSize;

            if (sprite._homeX !== targetHomeX || sprite._homeY !== targetHomeY) {
                sprite.setHome(targetHomeX, targetHomeY);
            }

            const standardFaceWidth = ImageManager.faceWidth || 144;
            const scaleRatio = faceSize / standardFaceWidth;
            
            const sign = Math.sign(sprite.scale.x) || 1; 
            sprite.scale.x = scaleRatio * sign;
            sprite.scale.y = scaleRatio;

            sprite.show();
            isSuperFVActive = true;
        }
        // ------------------------------------

        if (!isSuperFVActive) {
            this.drawActorFace(actor, finalX, finalY, faceSize, faceSize);
        }

        this.updateActorStateSprite(index, actor, finalX, finalY, faceSize);

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

        const faceBottom = finalY + faceSize;
        const nameBottom = nameY + this.lineHeight();
        let contentBottomY = Math.max(faceBottom, nameBottom) + 4;

        this.drawCustomGauges(actor, x, contentBottomY, width, valueFontSize, valueHeight);
    };

    Window_BattleStatus.prototype.drawCustomGauges = function(actor, x, startY, width, valueFontSize, valueHeight) {
        let contentBottomY = startY;

        const drawStatusRow = (iconBitmap, valueText, rateReal, rateBuffer, gaugeColor, useBuffer) => {
            if (useBuffer) {
                this.drawBufferedGauge(x, contentBottomY, width, rateReal, rateBuffer, gaugeColor);
            } else {
                this.drawColoredGauge(x, contentBottomY, width, rateReal, gaugeColor);
            }

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

        drawStatusRow(hpIconBitmap, `${actor.hp}/${actor.mhp}`, actor.hpRate(), actor.hpBufferRate(), HP_GAUGE_COLOR, true);
        drawStatusRow(mpIconBitmap, `${actor.mp}/${actor.mmp}`, actor.mpRate(), actor.mpBufferRate(), MP_GAUGE_COLOR, true);
        
        if (SHOW_TP_GAUGE) {
            drawStatusRow(tpIconBitmap, `${actor.tp}/${actor.maxTp()}`, actor.tpRate(), 0, TP_GAUGE_COLOR, false);
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

    Window_BattleStatus.prototype.drawBufferedGauge = function(x, y, width, rateReal, rateBuffer, color) {
        const height = gaugeHeight;
        const padding = gaugePadding;
        const fillMaxW = width - padding * 2;
        const fillH = height - padding * 2;
        const fillX = x + padding;
        const fillY = y + padding;

        this.contents.fillRect(x + padding, y + padding, fillMaxW, fillH, ColorManager.gaugeBackColor());

        const wReal = Math.floor(fillMaxW * Math.max(0, Math.min(1, rateReal)));
        const wBuffer = Math.floor(fillMaxW * Math.max(0, Math.min(1, rateBuffer)));

        if (rateReal < rateBuffer) {
            this.contents.fillRect(fillX, fillY, wBuffer, fillH, BUFFER_COLOR_DAMAGE);
            this.contents.fillRect(fillX, fillY, wReal, fillH, color);
        } else {
            this.contents.fillRect(fillX, fillY, wReal, fillH, BUFFER_COLOR_HEAL);
            this.contents.fillRect(fillX, fillY, wBuffer, fillH, color);
        }
    };

    const _Window_BattleStatus_update = Window_BattleStatus.prototype.update;
    Window_BattleStatus.prototype.update = function() {
        _Window_BattleStatus_update.call(this);
        
        if ($gameParty) {
            for (const actor of $gameParty.battleMembers()) {
                if (actor) {
                    actor.updateGaugeBuffers();
                }
            }
        }
        
        if (SceneManager._scene instanceof Scene_Battle) {
            this.refresh();
        }
    };
})();