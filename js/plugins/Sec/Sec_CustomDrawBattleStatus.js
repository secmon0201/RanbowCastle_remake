/*:
 * @target MZ
 * @plugindesc [战斗] 自适应状态栏 & 缓冲条 & 渐变计量槽 (v2.8 Spacing)
 * @author Secmon & Gemini
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 * @orderAfter Sq_BattleComplete
 * @orderBefore Sec_BattleVisuals
 *
 * @help
 * ============================================================================
 * Sec_CustomDrawBattleStatus.js (v2.8)
 * ============================================================================
 * 【v2.8 更新】
 * 新增 [计量槽-名字间距] 参数，解决布局拥挤问题。
 *
 * ============================================================================
 * * @param ---Layout---
 * @text [布局设置]
 * @default
 *
 * @param NameFontSize
 * @text 名字字体大小
 * @parent ---Layout---
 * @type number
 * @default 20
 *
 * @param NamePadding
 * @text 名字内边距
 * @parent ---Layout---
 * @desc 名字距离脸图左边缘的水平内边距
 * @type number
 * @default 6
 *
 * @param NameExtraOffsetY
 * @text 名字额外下偏移
 * @parent ---Layout---
 * @desc 名字相对于【头像区域底部】的向下偏移量。
 * @type number
 * @default 40
 *
 * @param GaugeOffsetY
 * @text 计量槽-名字间距
 * @parent ---Layout---
 * @desc [新增] 调整计量槽与名字之间的垂直空白距离（正数向下远离名字）。
 * @type number
 * @default 4
 *
 * @param FaceScale
 * @text 头像缩放比例
 * @parent ---Layout---
 * @desc 调整头像的大小（0.8表示80%，1.0表示原大小）
 * @type number
 * @decimals 2
 * @default 1.00
 *
 * @param FaceOffsetY
 * @text 头像Y轴微调
 * @parent ---Layout---
 * @desc 调整头像的垂直位置（正数向下，负数向上）
 * @type number
 * @default 1
 *
 * @param ---Gauges---
 * @text [计量槽设置]
 * @default
 * * @param ShowTpGauge
 * @text 是否显示TP条
 * @parent ---Gauges---
 * @desc true显示，false隐藏
 * @type boolean
 * @default false
 *
 * @param GaugeHeight
 * @text 进度条高度
 * @parent ---Gauges---
 * @type number
 * @default 12
 *
 * @param GaugePadding
 * @text 进度条内边距
 * @parent ---Gauges---
 * @type number
 * @default 1
 *
 * @param GaugeSpacing
 * @text 进度条间距
 * @parent ---Gauges---
 * @type number
 * @default 4
 *
 * @param ValueAreaWidth
 * @text 数值区域宽度
 * @parent ---Gauges---
 * @type number
 * @default 90
 *
 * @param ---Colors---
 * @text [颜色设置]
 * @default
 *
 * @param HpGaugeColor
 * @text HP渐变起始色
 * @parent ---Colors---
 * @type string
 * @default #ff6b6b
 *
 * @param HpGaugeColor2
 * @text HP渐变结束色
 * @parent ---Colors---
 * @type string
 * @default #ff9f43
 *
 * @param MpGaugeColor
 * @text MP渐变起始色
 * @parent ---Colors---
 * @type string
 * @default #4d96ff
 *
 * @param MpGaugeColor2
 * @text MP渐变结束色
 * @parent ---Colors---
 * @type string
 * @default #54a0ff
 *
 * @param TpGaugeColor
 * @text TP渐变起始色
 * @parent ---Colors---
 * @type string
 * @default #6bc547
 *
 * @param TpGaugeColor2
 * @text TP渐变结束色
 * @parent ---Colors---
 * @type string
 * @default #95d5b2
 *
 * @param ---State Icons---
 * @text [状态图标]
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
 * @text [窗口覆盖]
 * @default
 *
 * @param EnableCustomWindow
 * @text 启用窗口位置自定义
 * @parent ---Window Customization---
 * @desc 是否启用下方的窗口位置和大小设置？
 * @type boolean
 * @default true
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
 * @default 0
 *
 * @param WindowWidth
 * @text 窗口宽度
 * @parent ---Window Customization---
 * @desc 窗口宽度 (设为 0 则保持默认宽度)
 * @type number
 * @default 355
 *
 * @param WindowHeight
 * @text 窗口高度
 * @parent ---Window Customization---
 * @desc 窗口高度 (设为 0 则保持默认高度)
 * @type number
 * @default 145
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
 */

(() => {
    // 自动获取文件名参数
    const scriptUrl = document.currentScript.src;
    const pluginName = scriptUrl.match(/([^\/]+)\.js$/)[1];
    const parameters = PluginManager.parameters(pluginName);
    
    // --- Layout ---
    const nameFontSize = Number(parameters['NameFontSize'] || 20);
    const namePadding = Number(parameters['NamePadding'] || 6);
    const nameExtraOffsetY = Number(parameters['NameExtraOffsetY'] || 40);
    // [新增] 间距参数
    const gaugeOffsetY = Number(parameters['GaugeOffsetY'] || 4);
    
    const FACE_SCALE = Number(parameters['FaceScale'] || 1.00);
    const FACE_OFFSET_Y = Number(parameters['FaceOffsetY'] || 1);
    
    // --- Gauges ---
    const SHOW_TP_GAUGE = (parameters['ShowTpGauge'] === "true"); 
    const gaugeHeight = Number(parameters['GaugeHeight'] || 12);
    const gaugePadding = Number(parameters['GaugePadding'] || 1);
    const gaugeSpacing = Number(parameters['GaugeSpacing'] || 4);
    const valueAreaWidth = Number(parameters['ValueAreaWidth'] || 90);

    // --- Colors ---
    const HP_C1 = parameters['HpGaugeColor'] || "#ff6b6b";
    const HP_C2 = parameters['HpGaugeColor2'] || "#ff9f43";
    
    const MP_C1 = parameters['MpGaugeColor'] || "#4d96ff";
    const MP_C2 = parameters['MpGaugeColor2'] || "#54a0ff";
    
    const TP_C1 = parameters['TpGaugeColor'] || "#6bc547";
    const TP_C2 = parameters['TpGaugeColor2'] || "#95d5b2";

    const BUFFER_COLOR_DAMAGE = parameters['BufferColorDamage'] || "#FFFFFF";
    const BUFFER_COLOR_HEAL = parameters['BufferColorHeal'] || "#FFD700";

    // --- Icons ---
    const ICON_SIZE = 10;
    const STATE_ICON_SIZE = Number(parameters['StateIconSize'] || 24);
    const STATE_MAX_COUNT = Number(parameters['StateMaxCount'] || 4);
    const STATE_SPACING = Number(parameters['StateSpacing'] || 2);
    const STATE_ICON_OFFSET_X = Number(parameters['StateIconOffsetX'] || 0);
    const STATE_ICON_OFFSET_Y = Number(parameters['StateIconOffsetY'] || 0);

    // --- Window ---
    const ENABLE_CUSTOM_WINDOW = (parameters['EnableCustomWindow'] === "true");
    const CUSTOM_WIN_X = Number(parameters['WindowX'] || 0);
    const CUSTOM_WIN_Y = Number(parameters['WindowY'] || 0);
    const CUSTOM_WIN_W = Number(parameters['WindowWidth'] || 355);
    const CUSTOM_WIN_H = Number(parameters['WindowHeight'] || 145);

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

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        if (ENABLE_CUSTOM_WINDOW && this._statusWindow) {
            if (this._statusWindow.x !== CUSTOM_WIN_X) this._statusWindow.x = CUSTOM_WIN_X;
            if (this._statusWindow.y !== CUSTOM_WIN_Y) this._statusWindow.y = CUSTOM_WIN_Y;
        }
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

        // SuperFV 兼容
        let isSuperFVActive = false;
        if (this._additionalSprites && this._additionalSprites["sv_actor%1".format(index)]) {
            const sprite = this._additionalSprites["sv_actor%1".format(index)];

            sprite.updateFrame = function() {
                Sprite_Battler.prototype.updateFrame.call(this);
                const bitmap = this._mainSprite.bitmap;
                if (bitmap) {
                    const pw = ImageManager.faceWidth;
                    const ph = ImageManager.faceHeight;
                    const faceIndex = this._actor.faceIndex();
                    const sx = Math.floor((faceIndex % 4) * pw);
                    const sy = Math.floor(Math.floor(faceIndex / 4) * ph);
                    this._mainSprite.setFrame(sx, sy, pw, ph);
                    this.setFrame(0, 0, pw, ph);
                }
            };

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

        if (!isSuperFVActive) {
            this.drawActorFace(actor, finalX, finalY, faceSize, faceSize);
        }

        this.updateActorStateSprite(index, actor, finalX, finalY, faceSize);

        const nameY = finalY + faceSize + nameExtraOffsetY - this.lineHeight(); 
        const nameX = x + namePadding;

        const originalFontSize = this.contents.fontSize;
        this.contents.fontSize = nameFontSize;
        const nameColor = actor.isDead() ? "#AAAAAA" : "#FFFFFF";

        // 名字描边
        const offsets = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
        offsets.forEach(([dx, dy]) => {
            this.drawText(actor.name(), nameX + dx, nameY + dy, width, "left");
        });
        this.contents.textColor = nameColor;
        this.drawText(actor.name(), nameX, nameY, width, "left");
        this.contents.fontSize = originalFontSize;

        // [New] 计量槽起始Y = 名字底部 + 间距参数
        const gaugesStartY = nameY + this.lineHeight() + gaugeOffsetY; 
        
        this.drawCustomGauges(actor, x, gaugesStartY, width, valueFontSize, valueHeight);
    };

    Window_BattleStatus.prototype.drawCustomGauges = function(actor, x, startY, width, valueFontSize, valueHeight) {
        let contentBottomY = startY;

        const drawStatusRow = (iconBitmap, valueText, rateReal, rateBuffer, c1, c2, useBuffer) => {
            if (useBuffer) {
                this.drawBufferedGauge(x, contentBottomY, width, rateReal, rateBuffer, c1, c2);
            } else {
                this.drawColoredGauge(x, contentBottomY, width, rateReal, c1, c2);
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
            contentBottomY += gaugeHeight + gaugeSpacing;
        };

        // HP
        drawStatusRow(hpIconBitmap, `${actor.hp}/${actor.mhp}`, actor.hpRate(), actor.hpBufferRate(), HP_C1, HP_C2, true);
        // MP
        drawStatusRow(mpIconBitmap, `${actor.mp}/${actor.mmp}`, actor.mpRate(), actor.mpBufferRate(), MP_C1, MP_C2, true);
        
        // TP
        if (SHOW_TP_GAUGE) {
            drawStatusRow(tpIconBitmap, `${actor.tp}/${actor.maxTp()}`, actor.tpRate(), 0, TP_C1, TP_C2, false);
        }
    };

    // 渐变+普通条
    Window_BattleStatus.prototype.drawColoredGauge = function(x, y, width, rate, c1, c2) {
        const height = gaugeHeight;
        const padding = gaugePadding;
        const innerWidth = Math.floor((width - padding * 2) * rate);
        const innerHeight = height - padding * 2;

        this.contents.fillRect(x + padding, y + padding, width - padding * 2, innerHeight, "#202020");
        if (innerWidth > 0) {
            this.contents.gradientFillRect(x + padding, y + padding, innerWidth, innerHeight, c1, c2);
        }
    };

    // 渐变+缓冲条
    Window_BattleStatus.prototype.drawBufferedGauge = function(x, y, width, rateReal, rateBuffer, c1, c2) {
        const height = gaugeHeight;
        const padding = gaugePadding;
        const fillMaxW = width - padding * 2;
        const fillH = height - padding * 2;
        const fillX = x + padding;
        const fillY = y + padding;

        this.contents.fillRect(x + padding, y + padding, fillMaxW, fillH, "#202020");

        const wReal = Math.floor(fillMaxW * Math.max(0, Math.min(1, rateReal)));
        const wBuffer = Math.floor(fillMaxW * Math.max(0, Math.min(1, rateBuffer)));

        if (rateReal < rateBuffer) {
            this.contents.fillRect(fillX, fillY, wBuffer, fillH, BUFFER_COLOR_DAMAGE);
            this.contents.gradientFillRect(fillX, fillY, wReal, fillH, c1, c2);
        } else {
            this.contents.fillRect(fillX, fillY, wReal, fillH, BUFFER_COLOR_HEAL);
            this.contents.gradientFillRect(fillX, fillY, wBuffer, fillH, c1, c2);
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